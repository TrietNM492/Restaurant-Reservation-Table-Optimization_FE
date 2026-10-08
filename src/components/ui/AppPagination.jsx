import MuiPagination from '@mui/material/Pagination';

export default function AppPagination({ page, pageCount, total, pageSize = 10, onChange, className = '' }) {
  return (
    <nav className={`ui-pagination ${className}`.trim()} aria-label="Pagination">
      <span className="ui-pagination__count">
        Showing <strong>{total === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}</strong> of <strong>{total}</strong>
      </span>
      {pageCount > 0 && <MuiPagination
        className="ui-pagination__controls"
        count={pageCount}
        page={page}
        onChange={(_, nextPage) => onChange?.(nextPage)}
        size="small"
        shape="rounded"
        siblingCount={0}
        sx={{
          '& .MuiPaginationItem-root': { minWidth: 30, height: 30, borderRadius: '9px', color: '#67746c', fontSize: 12 },
          '& .MuiPaginationItem-root.Mui-selected': { bgcolor: '#eaf4ee', color: '#176d4e', fontWeight: 700 },
          '& .MuiPaginationItem-root.Mui-selected:hover': { bgcolor: '#dfefe5' },
          '& .MuiPaginationItem-root.Mui-disabled': { color: '#c8cfca' },
        }}
      />}
    </nav>
  );
}