import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function FormUpload({ label = 'Upload a file', id = 'file-upload', accept, hint = 'PNG, JPG or PDF', onChange, ...props }) {
  return (
    <Box component="label" className="ui-field ui-upload" htmlFor={id}>
      <span className="ui-field__label">{label}</span>
      <Box className="ui-upload__drop" sx={{ minHeight: 112, border: '1px dashed #cbd8ce', borderRadius: '14px', bgcolor: '#fafcfb', color: '#637169', '&:hover': { borderColor: '#7daa8b', bgcolor: '#f7faf8' } }}>
        <span aria-hidden="true">↑</span>
        <Typography component="strong" sx={{ fontSize: 12, fontWeight: 700 }}>Choose a file</Typography>
        <Typography component="small" sx={{ color: '#929e96', fontSize: 10 }}>or drag it here</Typography>
        <Typography component="small" sx={{ mt: '3px', color: '#929e96', fontSize: 10 }}>{hint}</Typography>
      </Box>
      <input className="ui-upload__input" type="file" id={id} accept={accept} onChange={onChange} {...props} />
    </Box>
  );
}