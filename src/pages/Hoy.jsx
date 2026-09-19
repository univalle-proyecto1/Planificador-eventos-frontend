export default function Hoy() {
    // Datos simulados (mock) para el prototipo visual
    const gestionesUrgentes = [
        {
            id: 1,
            evento: "Boda Ana y Carlos",
            tarea: "Confirmar cantidad final del catering",
            tiempoEstimado: "1 hora",
            prioridad: "Alta"
        },
        {
            id: 2,
            evento: "Conferencia Tech Yumbo",
            tarea: "Pagar anticipo de proveedores de sonido",
            tiempoEstimado: "2 horas",
            prioridad: "Crítica"
        }
    ];

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h1>Tablero de Hoy</h1>
            <p style={{ color: '#aaa' }}>Gestiones logísticas que requieren tu atención inmediata.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px' }}>
                {gestionesUrgentes.map(gestion => (
                    <div key={gestion.id} style={{
                        borderLeft: '5px solid #ff4757',
                        padding: '20px',
                        borderRadius: '4px',
                        backgroundColor: '#2f3542',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <span style={{
                                    backgroundColor: '#ff4757',
                                    color: 'white',
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    {gestion.prioridad}
                                </span>
                                <h3 style={{ margin: '10px 0 5px 0' }}>{gestion.tarea}</h3>
                                <p style={{ margin: '0', color: '#ced6e0' }}><strong>Evento:</strong> {gestion.evento}</p>
                                <p style={{ margin: '5px 0 0 0', color: '#a4b0be', fontSize: '14px' }}>⏱ Estimado: {gestion.tiempoEstimado}</p>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button style={{ padding: '8px 15px', backgroundColor: '#ffa502', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                                    Posponer
                                </button>
                                <button style={{ padding: '8px 15px', backgroundColor: '#2ed573', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                                    Hecho
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}