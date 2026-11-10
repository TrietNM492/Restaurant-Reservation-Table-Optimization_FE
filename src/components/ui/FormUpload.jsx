import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function FormUpload({ label = 'Upload a file', id = 'file-upload', accept, hint = 'PNG, JPG or PDF', onChange, ...props }) {
  return (
    <Box component="label" className="ui-field ui-upload" htmlFor={id}>
      <span className="ui-field__label" style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#475569' }}>{label}</span>
      <Box
        className="ui-upload__drop"
        sx={{
          minHeight: 112,
          border: '1px dashed #C4B5FD',
          borderRadius: '14px',
          bgcolor: '#F5F3FF',
          color: '#6D28D9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          transition: 'all 0.2s ease',
          '&:hover': { borderColor: '#8B5CF6', bgcolor: '#EDE9FE' },
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 20 }}>↑</span>
        <Typography component="strong" sx={{ fontSize: 12, fontWeight: 700 }}>Choose a file</Typography>
        <Typography component="small" sx={{ color: '#6D28D9', fontSize: 10, opacity: 0.8 }}>or drag it here</Typography>
        <Typography component="small" sx={{ mt: '3px', color: '#64748B', fontSize: 10 }}>{hint}</Typography>
      </Box>
      <input className="ui-upload__input" type="file" id={id} accept={accept} onChange={onChange} {...props} />
    </Box>
  );
}