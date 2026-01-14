export default function NewAppointmentPage() {
  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Nueva Cita</h1>
        <p className="page-subtitle">Funcionalidad temporalmente deshabilitada. Use el calendario para crear citas.</p>
      </div>
      
      <div className="pro-card">
        <div className="card-content">
          <p>Esta página está siendo actualizada. Por favor use el calendario para crear nuevas citas haciendo click en un slot vacío.</p>
          <a href="/admin/calendar" className="pro-btn pro-btn-primary mt-4 inline-block">
            Ir al Calendario
          </a>
        </div>
      </div>
    </div>
  )
}