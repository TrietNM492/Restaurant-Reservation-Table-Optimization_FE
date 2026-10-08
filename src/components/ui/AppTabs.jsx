import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

export default function AppTabs({ tabs, value, onChange, className = '' }) {
  return (
    <Tabs
      className={`ui-tabs ${className}`.trim()}
      value={value}
      onChange={(_, nextValue) => onChange?.(nextValue)}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      sx={{
        minHeight: 42,
        borderBottom: '1px solid #e9eeea',
        '& .MuiTabs-indicator': { height: 2, borderRadius: '2px 2px 0 0', bgcolor: '#16805b' },
        '& .MuiTab-root': { minWidth: 0, minHeight: 42, px: '13px', textTransform: 'none', color: '#828d86', fontSize: 12, fontWeight: 500 },
        '& .MuiTab-root.Mui-selected': { color: '#176d4e', fontWeight: 700 },
        '& .MuiTabs-scrollButtons': { width: 26 },
      }}
    >
      {tabs.map((tab) => <Tab key={tab.value} value={tab.value} label={tab.label} />)}
    </Tabs>
  );
}