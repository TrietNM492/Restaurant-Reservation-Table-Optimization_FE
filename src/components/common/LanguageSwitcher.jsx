import React, { useState } from 'react';
import { Button, Menu, MenuItem, Box, Typography } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useLanguage } from '../../contexts/LanguageContext';

const VietnamFlag = ({ round = false }) => (
  <svg
    width={round ? 22 : 24}
    height={round ? 22 : 16}
    viewBox={round ? "5 0 20 20" : "0 0 30 20"}
    style={{
      borderRadius: round ? '50%' : 3,
      display: 'block',
      flexShrink: 0,
      boxShadow: '0 0 1px rgba(0,0,0,0.25)',
    }}
  >
    <rect width="30" height="20" fill="#DA251D" />
    <polygon
      points="15,4 16.35,8.15 20.71,8.15 17.18,10.71 18.53,14.85 15,12.29 11.47,14.85 12.82,10.71 9.29,8.15 13.65,8.15"
      fill="#FFFF00"
    />
  </svg>
);

const UkFlag = ({ round = false }) => (
  <svg
    width={round ? 22 : 24}
    height={round ? 22 : 16}
    viewBox={round ? "15 0 30 30" : "0 0 60 30"}
    style={{
      borderRadius: round ? '50%' : 3,
      display: 'block',
      flexShrink: 0,
      boxShadow: '0 0 1px rgba(0,0,0,0.25)',
    }}
  >
    <clipPath id="uk-clip-ls">
      <path d="M0,0 v30 h60 v-30 z" />
    </clipPath>
    <clipPath id="uk-diag-ls">
      <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
    </clipPath>
    <g clipPath="url(#uk-clip-ls)">
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#uk-diag-ls)" stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </g>
  </svg>
);

export default function LanguageSwitcher({ sx = {} }) {
  const { language, changeLanguage } = useLanguage();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (code) => {
    changeLanguage(code);
    handleClose();
  };

  const isVi = language === 'vi';

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', ...sx }}>
      <Button
        id="language-switch-button"
        aria-controls={open ? 'language-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        disableElevation
        sx={{
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          p: { xs: 0, sm: '6px 10px' },
          minWidth: { xs: 38, sm: 'auto' },
          width: { xs: 38, sm: 'auto' },
          height: { xs: 38, sm: 36 },
          color: '#4338CA',
          bgcolor: '#EEF2F6',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: { xs: 0, sm: 1 },
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: '#E2E8F0',
          },
        }}
      >
        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isVi ? <VietnamFlag round /> : <UkFlag round />}
        </Box>
        <Typography
          component="span"
          sx={{
            display: { xs: 'none', sm: 'inline' },
            fontWeight: 600,
            fontSize: '0.875rem',
            color: '#4338CA',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {isVi ? 'Tiếng Việt' : 'English'}
        </Typography>
        <KeyboardArrowDownIcon
          sx={{
            display: { xs: 'none', sm: 'inline-flex' },
            fontSize: 18,
            color: '#4338CA',
            ml: -0.25,
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        />
      </Button>

      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-switch-button',
          dense: true,
          sx: { py: 0.5 },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            elevation: 3,
            sx: {
              mt: 1,
              minWidth: 140,
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              p: 0.5,
            },
          },
        }}
      >
        <MenuItem
          onClick={() => handleSelect('vi')}
          selected={isVi}
          sx={{
            borderRadius: '8px',
            py: 0.85,
            px: 1.25,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            fontWeight: isVi ? 700 : 500,
            color: isVi ? '#1E1B2E' : '#475569',
            '&.Mui-selected': {
              bgcolor: '#F5F3FF',
              color: '#4338CA',
              '&:hover': {
                bgcolor: '#EDE9FE',
              },
            },
            '&:hover': {
              bgcolor: '#F1F5F9',
            },
          }}
        >
          <VietnamFlag />
          <Typography
            variant="body2"
            sx={{
              fontWeight: isVi ? 700 : 500,
              fontSize: '0.875rem',
              color: 'inherit',
            }}
          >
            Tiếng Việt
          </Typography>
        </MenuItem>

        <MenuItem
          onClick={() => handleSelect('en')}
          selected={!isVi}
          sx={{
            borderRadius: '8px',
            py: 0.85,
            px: 1.25,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            fontWeight: !isVi ? 700 : 500,
            color: !isVi ? '#1E1B2E' : '#475569',
            '&.Mui-selected': {
              bgcolor: '#F5F3FF',
              color: '#4338CA',
              '&:hover': {
                bgcolor: '#EDE9FE',
              },
            },
            '&:hover': {
              bgcolor: '#F1F5F9',
            },
          }}
        >
          <UkFlag />
          <Typography
            variant="body2"
            sx={{
              fontWeight: !isVi ? 700 : 500,
              fontSize: '0.875rem',
              color: 'inherit',
            }}
          >
            English
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}
