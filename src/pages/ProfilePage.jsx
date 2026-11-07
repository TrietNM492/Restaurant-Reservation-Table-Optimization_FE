import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Avatar as MuiAvatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import { userService } from '../services/userService.js';
import { useAuthStore } from '../stores/useAuthStore';
import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar';

const CROP_FRAME_SIZE = 300;
const CROP_OUTPUT_SIZE = 512;

const getFormValues = (profile = {}) => ({
  fullname: profile.fullname ?? '',
  gender: profile.gender ?? '',
  phone: profile.phone ?? '',
  dateOfBirth: profile.dateOfBirth ?? '',
  indentityCard: profile.indentityCard ?? '',
  address: profile.address ?? '',
});

const getOffsetLimits = (image, zoom) => {
  if (!image?.naturalWidth || !image?.naturalHeight) {
    return { x: 0, y: 0 };
  }

  const scale = Math.max(
    CROP_FRAME_SIZE / image.naturalWidth,
    CROP_FRAME_SIZE / image.naturalHeight,
  ) * zoom;

  return {
    x: Math.max(0, (image.naturalWidth * scale - CROP_FRAME_SIZE) / 2),
    y: Math.max(0, (image.naturalHeight * scale - CROP_FRAME_SIZE) / 2),
  };
};

const clampOffset = (offset, image, zoom) => {
  const limits = getOffsetLimits(image, zoom);
  return {
    x: Math.max(-limits.x, Math.min(limits.x, offset.x)),
    y: Math.max(-limits.y, Math.min(limits.y, offset.y)),
  };
};

const createCroppedAvatar = (image, zoom, offset) => new Promise((resolve, reject) => {
  if (!image?.naturalWidth || !image?.naturalHeight) {
    reject(new Error('The selected image could not be loaded.'));
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = CROP_OUTPUT_SIZE;
  canvas.height = CROP_OUTPUT_SIZE;
  const context = canvas.getContext('2d');

  if (!context) {
    reject(new Error('Your browser could not prepare the selected image.'));
    return;
  }

  const scale = Math.max(
    CROP_FRAME_SIZE / image.naturalWidth,
    CROP_FRAME_SIZE / image.naturalHeight,
  ) * zoom;
  const outputScale = CROP_OUTPUT_SIZE / CROP_FRAME_SIZE;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const x = (CROP_FRAME_SIZE - width) / 2 + offset.x;
  const y = (CROP_FRAME_SIZE - height) / 2 + offset.y;

  context.drawImage(
    image,
    x * outputScale,
    y * outputScale,
    width * outputScale,
    height * outputScale,
  );
  canvas.toBlob((blob) => {
    if (!blob) {
      reject(new Error('The selected image could not be processed.'));
      return;
    }

    resolve(new File([blob], 'profile-avatar.jpg', { type: 'image/jpeg' }));
  }, 'image/jpeg', 0.92);
});

function ProfilePage() {
  const updateAuthUser = useAuthStore((state) => state.updateUser);
  const authUser = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState(null);
  const [values, setValues] = useState(getFormValues());
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarOffset, setAvatarOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const response = await userService.getProfile();
        const nextProfile = response?.profile ?? {};
        if (active) {
          setProfile(nextProfile);
          setValues(getFormValues(nextProfile));
          const loginUser = response?.user?.user ?? response?.user;
          updateAuthUser({
            ...(loginUser && typeof loginUser === 'object' ? loginUser : {}),
            ...(nextProfile.fullname
              ? { fullname: nextProfile.fullname, name: nextProfile.fullname }
              : {}),
            ...(nextProfile.avatar ? { avatar: nextProfile.avatar } : {}),
          });
        }
      } catch (error) {
        if (active) setFeedback({ severity: 'error', message: error.message });
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, [updateAuthUser]);

  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const syncAuthUser = (response, nextProfile) => {
    const loginUser = response?.user?.user ?? response?.user;
    updateAuthUser({
      ...(loginUser && typeof loginUser === 'object' ? loginUser : {}),
      ...(nextProfile.fullname
        ? { fullname: nextProfile.fullname, name: nextProfile.fullname }
        : {}),
      ...(nextProfile.avatar ? { avatar: nextProfile.avatar } : {}),
    });
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    if (!values.fullname.trim()) {
      setFeedback({ severity: 'error', message: 'Full name is required.' });
      return;
    }

    setSavingProfile(true);
    setFeedback(null);
    try {
      const response = await userService.updateProfile({
        ...values,
        fullname: values.fullname.trim(),
        gender: values.gender || undefined,
        phone: values.phone || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        indentityCard: values.indentityCard || undefined,
        address: values.address || undefined,
      });
      const nextProfile = response?.profile ?? { ...profile, ...values };
      setProfile(nextProfile);
      setValues(getFormValues(nextProfile));
      syncAuthUser(response, nextProfile);
      setEditing(false);
      setFeedback({ severity: 'success', message: 'Profile updated successfully.' });
    } catch (error) {
      setFeedback({ severity: 'error', message: error.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const selectAvatarFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFeedback({ severity: 'error', message: 'Choose an image file to use as your profile photo.' });
      return;
    }

    setFeedback(null);
    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAvatarZoom(1);
    setAvatarOffset({ x: 0, y: 0 });
  };

  const handleFileInput = (event) => {
    selectAvatarFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    selectAvatarFile(event.dataTransfer.files?.[0]);
  };

  const handleCropPointerDown = (event) => {
    if (!avatarFile) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      offset: avatarOffset,
    };
    setDragging(true);
  };

  const handleCropPointerMove = (event) => {
    if (!dragRef.current) return;
    const nextOffset = {
      x: dragRef.current.offset.x + event.clientX - dragRef.current.x,
      y: dragRef.current.offset.y + event.clientY - dragRef.current.y,
    };
    setAvatarOffset(clampOffset(nextOffset, imageRef.current, avatarZoom));
  };

  const stopCropDragging = () => {
    dragRef.current = null;
    setDragging(false);
  };

  const handleZoomChange = (_event, value) => {
    setAvatarZoom(value);
    setAvatarOffset((offset) => clampOffset(offset, imageRef.current, value));
  };

  const closeAvatarDialog = (force = false) => {
    if (savingAvatar && !force) return;
    setAvatarDialogOpen(false);
    setAvatarFile(null);
    setPreviewUrl('');
    setAvatarOffset({ x: 0, y: 0 });
    setAvatarZoom(1);
  };

  const handleAvatarSave = async () => {
    if (!avatarFile) return;

    setSavingAvatar(true);
    setFeedback(null);
    try {
      const croppedFile = await createCroppedAvatar(imageRef.current, avatarZoom, avatarOffset);
      await userService.changeAvatar(croppedFile);
      const response = await userService.getProfile();
      const nextProfile = response?.profile ?? profile;
      setProfile(nextProfile);
      syncAuthUser(response, nextProfile);
      closeAvatarDialog(true);
      setFeedback({ severity: 'success', message: 'Profile photo updated successfully.' });
    } catch (error) {
      setFeedback({ severity: 'error', message: error.message });
    } finally {
      setSavingAvatar(false);
    }
  };

  const fullName = profile?.fullname || values.fullname || 'Your profile';
  const avatarSrc = profile?.avatar || authUser?.avatar || undefined;

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 7 }, minHeight: '65vh' }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>My profile</Typography>
            <Typography color="text.secondary">View and manage your account information.</Typography>
          </Box>

          {feedback ? (
            <Alert severity={feedback.severity} onClose={() => setFeedback(null)}>
              {feedback.message}
            </Alert>
          ) : null}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Paper sx={{ p: { xs: 2.5, md: 4 }, border: '1px solid', borderColor: 'divider' }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2.5}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                sx={{ mb: 4 }}
              >
                <Box
                  component="button"
                  type="button"
                  aria-label="View and change profile photo"
                  onClick={() => setAvatarDialogOpen(true)}
                  sx={{
                    position: 'relative',
                    display: 'inline-flex',
                    p: 0,
                    border: 0,
                    borderRadius: '50%',
                    bgcolor: 'transparent',
                    cursor: 'pointer',
                    '&:hover .profile-avatar-edit': { opacity: 1 },
                  }}
                >
                  <MuiAvatar
                    src={avatarSrc}
                    alt={fullName}
                    sx={{ width: 104, height: 104, fontSize: 32, bgcolor: 'primary.light' }}
                  >
                    {fullName.charAt(0).toUpperCase()}
                  </MuiAvatar>
                  <Box
                    className="profile-avatar-edit"
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: '50%',
                      color: '#fff',
                      bgcolor: 'rgba(0,0,0,.42)',
                      opacity: { xs: 1, sm: 0 },
                      transition: 'opacity .2s',
                    }}
                  >
                    <PhotoCameraOutlinedIcon />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{fullName}</Typography>
                  <Typography color="text.secondary">
                    {authUser?.email || ''}
                  </Typography>
                  <Button sx={{ mt: 1, px: 0 }} onClick={() => setAvatarDialogOpen(true)}>
                    Change profile photo
                  </Button>
                </Box>
              </Stack>

              <Box component="form" onSubmit={handleProfileSave}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  spacing={1.5}
                  sx={{ mb: 2.5 }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Personal information</Typography>
                  {editing ? (
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        color="inherit"
                        onClick={() => {
                          setValues(getFormValues(profile));
                          setEditing(false);
                        }}
                        disabled={savingProfile}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="contained" disabled={savingProfile}>
                        {savingProfile ? 'Saving...' : 'Save changes'}
                      </Button>
                    </Stack>
                  ) : (
                    <Button variant="contained" onClick={() => setEditing(true)}>
                      Edit profile
                    </Button>
                  )}
                </Stack>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <TextField
                    label="Full name"
                    name="fullname"
                    value={values.fullname}
                    onChange={handleProfileChange}
                    disabled={!editing || savingProfile}
                    required
                    fullWidth
                  />
                  <TextField
                    select
                    label="Gender"
                    name="gender"
                    value={values.gender}
                    onChange={handleProfileChange}
                    disabled={!editing || savingProfile}
                    fullWidth
                  >
                    {/* <MenuItem value="">Not specified</MenuItem> */}
                    {['DEFAULT', 'MALE', 'FEMALE', 'OTHER'].map((gender) => (
                      <MenuItem key={gender} value={gender}>{gender}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Phone"
                    name="phone"
                    value={values.phone}
                    onChange={handleProfileChange}
                    disabled={!editing || savingProfile}
                    fullWidth
                  />
                  <TextField
                    label="Date of birth"
                    name="dateOfBirth"
                    type="date"
                    value={values.dateOfBirth}
                    onChange={handleProfileChange}
                    disabled={!editing || savingProfile}
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: new Date().toISOString().slice(0, 10) } }}
                    fullWidth
                  />
                  <TextField
                    label="Identity card"
                    name="indentityCard"
                    value={values.indentityCard}
                    onChange={handleProfileChange}
                    disabled={!editing || savingProfile}
                    fullWidth
                  />
                  <TextField
                    label="Address"
                    name="address"
                    value={values.address}
                    onChange={handleProfileChange}
                    disabled={!editing || savingProfile}
                    fullWidth
                  />
                </Box>
              </Box>
            </Paper>
          )}
        </Stack>
      </Container>
      <Footer />

      <Dialog
        open={avatarDialogOpen}
        onClose={closeAvatarDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update profile photo</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} alignItems="center" sx={{ pt: 1 }}>
            <Box
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onPointerDown={handleCropPointerDown}
              onPointerMove={handleCropPointerMove}
              onPointerUp={stopCropDragging}
              onPointerCancel={stopCropDragging}
              sx={{
                position: 'relative',
                width: CROP_FRAME_SIZE,
                height: CROP_FRAME_SIZE,
                maxWidth: '100%',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px dashed',
                borderColor: dragging ? 'primary.main' : 'divider',
                bgcolor: 'action.hover',
                cursor: avatarFile ? (dragging ? 'grabbing' : 'grab') : 'default',
                touchAction: 'none',
                flexShrink: 0,
              }}
            >
              {previewUrl ? (
                <Box
                  component="img"
                  ref={imageRef}
                  src={previewUrl}
                  alt="Preview of the selected profile photo"
                  draggable={false}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `translate(${avatarOffset.x}px, ${avatarOffset.y}px) scale(${avatarZoom})`,
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}
                />
              ) : (
                <Stack
                  spacing={1}
                  alignItems="center"
                  justifyContent="center"
                  sx={{ position: 'absolute', inset: 0, p: 3, textAlign: 'center' }}
                >
                  <PhotoCameraOutlinedIcon color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Drop an image here or choose one from your device.
                  </Typography>
                </Stack>
              )}
            </Box>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileInput}
            />
            <Button variant="outlined" onClick={() => fileInputRef.current?.click()}>
              Choose image
            </Button>

            {avatarFile ? (
              <Box sx={{ width: '100%', maxWidth: 340 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>Zoom and drag to adjust</Typography>
                <Slider
                  aria-label="Avatar image zoom"
                  min={1}
                  max={3}
                  step={0.05}
                  value={avatarZoom}
                  onChange={handleZoomChange}
                />
              </Box>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeAvatarDialog} disabled={savingAvatar}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAvatarSave}
            disabled={!avatarFile || savingAvatar}
          >
            {savingAvatar ? 'Saving...' : 'Save photo'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ProfilePage;
