import { useMemo, useState } from 'react';
import AppMenu from '../components/ui/AppMenu';
import AppPagination from '../components/ui/AppPagination';
import AppTabs from '../components/ui/AppTabs';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DatePicker from '../components/ui/DatePicker';
import Drawer from '../components/ui/Drawer';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Form from '../components/ui/Form';
import FormTextField from '../components/ui/FormTextField';
import FormUpload from '../components/ui/FormUpload';
import Input from '../components/ui/Input';
import Loading from '../components/ui/Loading';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import Snackbar from '../components/ui/Snackbar';
import Table from '../components/ui/Table';
import Tooltip from '../components/ui/Tooltip';

const reservations = [
  { id: '1', name: 'Olivia Rhye', email: 'olivia.rhye@email.com', time: '6:30 PM', party: '2 guests', table: 'T-04', status: 'Confirmed', tone: 'success', initials: 'OR' },
  { id: '2', name: 'Phoenix Baker', email: 'phoenix.baker@email.com', time: '6:45 PM', party: '4 guests', table: 'T-12', status: 'Seated', tone: 'info', initials: 'PB' },
  { id: '3', name: 'Lana Steiner', email: 'lana.steiner@email.com', time: '7:00 PM', party: '2 guests', table: 'T-08', status: 'Confirmed', tone: 'success', initials: 'LS' },
  { id: '4', name: 'Demi Wilkinson', email: 'demi.wilkinson@email.com', time: '7:15 PM', party: '6 guests', table: 'T-16', status: 'Pending', tone: 'warning', initials: 'DW' },
  { id: '5', name: 'Candice Wu', email: 'candice.wu@email.com', time: '7:30 PM', party: '3 guests', table: 'T-02', status: 'Confirmed', tone: 'success', initials: 'CW' },
];

const navGroups = [
  { label: 'Workspace', links: [['▦', 'Overview'], ['▤', 'Reservations', '12'], ['▧', 'Floor plan'], ['◷', 'Waitlist']] },
  { label: 'Management', links: [['♙', 'Guests'], ['◫', 'Analytics'], ['☷', 'Menu & hours']] },
];

const columns = [
  {
    key: 'guest',
    label: 'Guest',
    render: (row) => <div className="preview-guest"><Avatar name={row.name} size="small" /><div><span className="preview-guest__name">{row.name}</span><span className="preview-guest__note">{row.email}</span></div></div>,
  },
  { key: 'time', label: 'Time', render: (row) => <span className="preview-time">{row.time}</span> },
  { key: 'party', label: 'Party', render: (row) => <span className="preview-party">{row.party}</span> },
  { key: 'table', label: 'Table' },
  { key: 'status', label: 'Status', render: (row) => <Badge tone={row.tone}>{row.status}</Badge> },
  { key: 'actions', label: '', render: () => <AppMenu label="Reservation options"><button type="button">View details</button><button type="button">Edit booking</button></AppMenu> },
];

function MetricCard({ title, value, note, trend, icon, down = false }) {
  return (
    <Card className="preview-kpi">
      <div className="preview-kpi__top"><span>{title}</span><span className="preview-kpi__icon" aria-hidden="true">{icon}</span></div>
      <div className="preview-kpi__value">{value}</div>
      <div className="preview-kpi__foot"><span className={`preview-kpi__trend${down ? ' down' : ''}`}>{trend}</span><span>{note}</span></div>
    </Card>
  );
}

function PageTemp() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const filteredReservations = useMemo(() => reservations.filter((reservation) => {
    const matchesSearch = `${reservation.name} ${reservation.email}`.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || reservation.status.toLowerCase() === activeTab;
    return matchesSearch && matchesTab;
  }), [activeTab, search]);

  const handleCreateReservation = (event) => {
    event.preventDefault();
    setModalOpen(false);
    setSnackbar('Reservation added to tonight’s service.');
  };

  return (
    <div className="preview-shell">
      <aside className="preview-sidebar" aria-label="Main navigation">
        <a className="preview-brand" href="#overview" aria-label="Seatwise home">
          <span className="preview-brand__icon">S</span>
          <span className="preview-brand__copy">seatwise<small>RESTAURANT OS</small></span>
        </a>
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="preview-nav-label">{group.label}</div>
            <nav className="preview-nav">
              {group.links.map(([icon, label, count]) => (
                <a className={label === 'Overview' ? 'is-active' : ''} href={`#${label.toLowerCase().replaceAll(' ', '-')}`} key={label}>
                  <span className="preview-nav__icon" aria-hidden="true">{icon}</span><span>{label}</span>
                  {count && <span className="preview-nav__count">{count}</span>}
                </a>
              ))}
            </nav>
          </div>
        ))}
        <div className="preview-sidebar__bottom">
          <div className="preview-help"><strong>Need a hand?</strong><p>Our team is here to help you make service seamless.</p><Button variant="secondary" size="small" onClick={() => setDrawerOpen(true)}>Visit help center</Button></div>
          <div className="preview-account"><Avatar name="The Greenhouse" /><div><strong>The Greenhouse</strong><small>Restaurant admin</small></div><span className="preview-account__more">···</span></div>
        </div>
      </aside>

      <main className="preview-main" id="overview">
        <header className="preview-topbar">
          <div className="preview-breadcrumb"><span>Workspace</span><span>/</span><strong>Overview</strong></div>
          <div className="preview-topbar__actions">
            <Tooltip content="Search your workspace"><button type="button" className="preview-icon-btn" aria-label="Search">⌕</button></Tooltip>
            <button type="button" className="preview-icon-btn" aria-label="Notifications" onClick={() => setSnackbar('You’re all caught up.')}>♧<span className="preview-notice-dot" /></button>
            <Avatar name="Alex Morgan" size="small" />
          </div>
        </header>

        <div className="preview-content">
          <section className="preview-heading">
            <div><div className="preview-heading__eyebrow">Thursday, October 8, 2026</div><h1>Good evening, Alex <span aria-hidden="true">✦</span></h1><p>Here’s what’s happening at your restaurant today.</p></div>
            <div className="preview-heading__actions">
              <button type="button" className="preview-date-button" onClick={() => setSnackbar('Showing today’s service')}><span>▦</span>Today, Oct 8⌄</button>
              <Button onClick={() => setModalOpen(true)}><span aria-hidden="true">＋</span>New reservation</Button>
            </div>
          </section>

          <section className="preview-kpis" aria-label="Today's key metrics">
            <MetricCard title="Reservations" value="84" trend="↑ 12.8%" note="vs. last Thursday" icon="▤" />
            <MetricCard title="Covers" value="216" trend="↑ 8.2%" note="vs. last Thursday" icon="♙" />
            <MetricCard title="Estimated revenue" value="$8,420" trend="↑ 6.4%" note="vs. last Thursday" icon="$" />
            <MetricCard title="Avg. table turn" value="1h 42m" trend="↓ 4.1%" note="faster this week" icon="◷" down />
          </section>

          <section className="preview-grid">
            <div className="preview-stack">
              <Card className="preview-analytics">
                <div className="preview-panel-head"><div><h2>Reservation trends</h2><p>Guest bookings over the last 7 days</p></div><Select aria-label="Analytics period" id="analytics-period" options={['This week', 'Last week', 'This month']} /></div>
                <div className="preview-analytics__summary"><strong>482</strong><span>reservations this week <Badge tone="success">+14.6%</Badge></span></div>
                <div className="preview-chart" aria-label="Bar chart showing bookings through the week">
                  {[48, 68, 55, 82, 64, 95, 72].map((height, index) => <div className="preview-chart__group" key={height + index}><span className="preview-chart__bar" style={{ height: `${height * 0.78}%` }} /><span className="preview-chart__bar preview-chart__bar--primary" style={{ height: `${height}%` }} /></div>)}
                </div>
                <div className="preview-chart__labels"><span>Fri</span><span>Sat</span><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span></div>
                <div className="preview-legend"><span><i />This week</span><span><i />Last week</span></div>
              </Card>

              <Card className="preview-occupancy">
                <div className="preview-panel-head"><div><h2>Table occupancy</h2><p>Live floor utilization</p></div><Badge tone="success">Live</Badge></div>
                <div className="preview-occupancy__body">
                  <div className="preview-donut" role="img" aria-label="68 percent of tables occupied"><div className="preview-donut__inner"><strong>68%</strong><small>occupied</small></div></div>
                  <div className="preview-occupancy__legend"><div><span><i />Seated</span><strong>24 tables</strong></div><div><span><i />Reserved</span><strong>8 tables</strong></div><div><span><i />Available</span><strong>12 tables</strong></div></div>
                </div>
              </Card>
            </div>

            <div className="preview-stack">
              <Card>
                <div className="preview-panel-head"><div><h2>Today at a glance</h2><p>Your service is looking great</p></div><AppMenu label="Service options"><button type="button" onClick={() => setDrawerOpen(true)}>Service details</button><button type="button" onClick={() => setSnackbar('Service report is ready.')}>Export report</button></AppMenu></div>
                <div className="preview-section-title"><h3>Upcoming arrivals</h3><a href="#reservations">View all</a></div>
                <div className="preview-activity">
                  <div className="preview-activity__item"><span className="preview-activity__icon">♙</span><div className="preview-activity__copy"><strong>Olivia Rhye</strong> · 2 guests<small>6:30 PM · Table T-04</small></div><Badge tone="success">Soon</Badge></div>
                  <div className="preview-activity__item"><span className="preview-activity__icon">♙</span><div className="preview-activity__copy"><strong>Phoenix Baker</strong> · 4 guests<small>6:45 PM · Table T-12</small></div></div>
                  <div className="preview-activity__item"><span className="preview-activity__icon">♙</span><div className="preview-activity__copy"><strong>Lana Steiner</strong> · 2 guests<small>7:00 PM · Table T-08</small></div></div>
                </div>
              </Card>
              <Card>
                <div className="preview-panel-head"><div><h2>Guest insights</h2><p>A little more about tonight’s guests</p></div><a className="preview-panel-head__action" href="#guests">Details →</a></div>
                <div className="preview-activity">
                  <div className="preview-activity__item"><span className="preview-activity__icon">♡</span><div className="preview-activity__copy"><strong>18 returning guests</strong><small>21% of tonight’s bookings</small></div></div>
                  <div className="preview-activity__item"><span className="preview-activity__icon">✦</span><div className="preview-activity__copy"><strong>3 special occasions</strong><small>Make their evening memorable</small></div></div>
                </div>
              </Card>
            </div>
          </section>

          <Card className="preview-table-card" id="reservations">
            <div className="preview-table-head"><div><h2 style={{ margin: 0, color: '#2d3b32', fontFamily: 'Manrope, sans-serif', fontSize: 14 }}>Tonight’s reservations</h2><p style={{ margin: '5px 0 0', color: '#89958d', fontSize: 10 }}>Manage your upcoming service at a glance</p></div><Button variant="ghost" size="small" onClick={() => setDrawerOpen(true)}>View floor plan ↗</Button></div>
            <AppTabs tabs={[{ value: 'all', label: 'All bookings' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'seated', label: 'Seated' }, { value: 'pending', label: 'Pending' }]} value={activeTab} onChange={(value) => { setActiveTab(value); setPage(1); }} />
            <div className="preview-reservation-toolbar">
              <label className="preview-search"><span aria-hidden="true">⌕</span><Input aria-label="Search guests" id="reservation-search" placeholder="Search guests..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
              <div className="preview-toolbar-actions"><button type="button" className="preview-toolbar-button" onClick={() => setSnackbar('Filters are up to date.')}>☷ Filter</button><button type="button" className="preview-toolbar-button" onClick={() => setSnackbar('Showing tonight’s service.')}>▤ Tonight⌄</button></div>
            </div>
            <div className="preview-table"><Table columns={columns} rows={filteredReservations} emptyMessage="No reservations match your search." /></div>
            <AppPagination className="preview-pagination" page={page} pageCount={filteredReservations.length ? 1 : 0} total={filteredReservations.length} pageSize={8} onChange={setPage} />
          </Card>

          <section className="preview-component-samples" aria-label="UI component samples">
            <Card className="preview-sample-card">
              <h3>Buttons & status</h3><p>Consistent actions, accessible states, and status communication.</p>
              <div className="preview-sample-stack"><Button onClick={() => setSnackbar('Your changes have been saved.')}>Primary action</Button><Button variant="secondary">Secondary</Button><Button variant="ghost">Quiet action</Button></div>
              <div className="preview-sample-divider" />
              <div className="preview-sample-stack"><Badge tone="success">Confirmed</Badge><Badge tone="warning">Pending</Badge><Badge tone="danger">Cancelled</Badge><Badge tone="neutral">Draft</Badge></div>
              <div className="preview-sample-divider" />
              <div className="preview-sample-stack"><Avatar name="Olivia Rhye" /><Avatar name="Phoenix Baker" /><Avatar name="Lana Steiner" /><Tooltip content="Three more teammates"><Avatar name="+3" /></Tooltip></div>
            </Card>
            <Card className="preview-sample-card">
              <h3>Reservation form</h3><p>44px inputs with clear labels and comfortable spacing.</p>
              <Form onSubmit={(event) => { event.preventDefault(); setSnackbar('Guest details saved.'); }}>
                <FormTextField id="sample-guest-name" label="Guest name" placeholder="e.g. Jamie Chen" />
                <div className="preview-sample-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}><DatePicker id="sample-date" label="Date" defaultValue="2026-10-08" /><Select id="sample-party" label="Party size" options={['2 guests', '3 guests', '4 guests', '5+ guests']} /></div>
                <Button type="submit">Save details</Button>
              </Form>
            </Card>
            <Card className="preview-sample-card">
              <h3>States & feedback</h3><p>Helpful empty, loading, and error states for every flow.</p>
              <div className="preview-sample-stack"><Button variant="secondary" size="small" onClick={() => setConfirmOpen(true)}>Open confirmation</Button><Button variant="secondary" size="small" onClick={() => setDrawerOpen(true)}>Open drawer</Button></div>
              <div className="preview-sample-divider" />
              <Loading label="Loading availability" />
            </Card>
          </section>
          <section className="preview-component-samples" aria-label="More UI states">
            <Card className="preview-sample-card"><h3>Empty state</h3><EmptyState title="No VIP notes yet" description="Guest preferences will appear here after your first visit." /></Card>
            <Card className="preview-sample-card"><h3>Skeleton loading</h3><Loading variant="skeleton" rows={5} /></Card>
            <Card className="preview-sample-card"><h3>Upload & error feedback</h3><FormUpload id="sample-upload" label="Restaurant photos" hint="PNG, JPG up to 10MB" /><div className="preview-sample-divider" /><ErrorState title="Couldn’t load menus" description="Check your connection and try again." onRetry={() => setSnackbar('Retrying menu sync…')} /></Card>
          </section>
        </div>
      </main>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create a reservation" size="large">
        <div className="ui-modal__body"><p style={{ margin: '0 0 18px', color: '#819087', fontSize: 12 }}>Add a booking to tonight’s service. Your guest will be added to the floor plan automatically.</p>
          <Form onSubmit={handleCreateReservation}>
            <div className="preview-sample-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}><FormTextField id="new-guest-name" label="Guest name" placeholder="Jamie Chen" required /><FormTextField id="new-guest-email" type="email" label="Email address" placeholder="jamie@email.com" /></div>
            <div className="preview-sample-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}><DatePicker id="new-reservation-date" label="Date" defaultValue="2026-10-08" required /><Select id="new-reservation-time" label="Time" options={['6:00 PM', '6:15 PM', '6:30 PM', '6:45 PM', '7:00 PM']} /><Select id="new-reservation-party" label="Party size" options={['2 guests', '3 guests', '4 guests', '5 guests', '6 guests']} /></div>
            <footer className="ui-modal__footer" style={{ padding: '16px 0 0', marginTop: 4 }}><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button type="submit">Confirm reservation</Button></footer>
          </Form>
        </div>
      </Modal>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Service overview">
        <div className="preview-stack">
          <Card className="preview-sample-card"><h3>Tonight’s service</h3><p>Thursday, October 8 · Dinner service</p><Badge tone="success">On track</Badge><div className="preview-sample-divider" /><strong style={{ color: '#33443a', fontSize: 13 }}>84 reservations · 216 covers</strong></Card>
          <Card className="preview-sample-card"><h3>Floor notes</h3><p>Patio is open. Table T-08 requested a quiet area. The kitchen closes at 10:00 PM.</p></Card>
          <Button onClick={() => { setDrawerOpen(false); setSnackbar('Service notes saved.'); }}>Done</Button>
        </div>
      </Drawer>
      <ConfirmDialog open={confirmOpen} onCancel={() => setConfirmOpen(false)} onConfirm={() => { setConfirmOpen(false); setSnackbar('Reservation changes discarded.'); }} title="Discard this reservation?">
        Your unsaved changes will be lost. This action can’t be undone.
      </ConfirmDialog>
      <Snackbar open={Boolean(snackbar)} message={snackbar} onClose={() => setSnackbar('')} />
    </div>
  );
}

export default PageTemp;