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
        borderBottom: '1px solid #E2E8F0',
        '& .MuiTabs-indicator': { height: 2, borderRadius: '2px 2px 0 0', bgcolor: '#6D28D9' },
        '& .MuiTab-root': { minWidth: 0, minHeight: 42, px: '13px', textTransform: 'none', color: '#64748B', fontSize: 12, fontWeight: 600 },
        '& .MuiTab-root.Mui-selected': { color: '#6D28D9', fontWeight: 700 },
        '& .MuiTabs-scrollButtons': { width: 26 },
      }}
    >
      {tabs.map((tab) => <Tab key={tab.value} value={tab.value} label={tab.label} />)}
    </Tabs>
  );
}