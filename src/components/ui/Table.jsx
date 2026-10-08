import Paper from '@mui/material/Paper';
import TableCell from '@mui/material/TableCell';
import MuiTable from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

export default function Table({ columns, rows, getRowKey, className = '', emptyMessage = 'No records found', ...props }) {
  return (
    <TableContainer className={`ui-table-wrap ${className}`.trim()} component={Paper} elevation={0} sx={{ maxHeight: 440, borderRadius: 0 }}>
      <MuiTable className="ui-table" stickyHeader size="small" {...props} sx={{
        '& .MuiTableCell-root': { px: '14px', py: '12px', borderBottomColor: '#f0f2f0', color: '#4d5a52', fontSize: 12, whiteSpace: 'nowrap' },
        '& .MuiTableHead-root .MuiTableCell-root': { bgcolor: '#fbfcfb', color: '#87928b', fontSize: 10, fontWeight: 700, letterSpacing: '.075em', textTransform: 'uppercase', borderBottomColor: '#edf0ed' },
        '& .MuiTableBody-root .MuiTableRow-root:hover': { bgcolor: '#fafcfb' },
      }}>
        <TableHead><TableRow>{columns.map((column) => <TableCell key={column.key} scope="col">{column.label}</TableCell>)}</TableRow></TableHead>
        <TableBody>
          {rows.length ? rows.map((row, index) => (
            <TableRow key={getRowKey ? getRowKey(row) : row.id ?? index}>
              {columns.map((column) => <TableCell key={column.key}>{column.render ? column.render(row) : row[column.key]}</TableCell>)}
            </TableRow>
          )) : <TableRow><TableCell className="ui-table__empty" colSpan={columns.length} align="center">{emptyMessage}</TableCell></TableRow>}
        </TableBody>
      </MuiTable>
    </TableContainer>
  );
}