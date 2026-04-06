import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, X, Check, Download, List, ChevronLeft, ChevronRight } from 'lucide-react';

const SUPABASE_URL = 'https://wjrdjfiuvffbqseeflvr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcmRqZml1dmZmYnFzZWVmbHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNDE1NjgsImV4cCI6MjA5MDkxNzU2OH0.yDSVFvOrgkq3y0f0X-ZYIlBbkF8AY5D7XD3YZUVk9qI';

const supabaseRequest = async (endpoint, options = {}) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Supabase error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
};

const YachtReservationSystem = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showPastReservations, setShowPastReservations] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [view, setView] = useState('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedReservation, setSelectedReservation] = useState(null);
  
  const socios = ['Loly', 'Diego', 'Yolanda', 'Graciela'];
  
  const [formData, setFormData] = useState({
    Fecha_salida: '',
    hora_salida: '',
    Fecha_regreso: '',
    Hora_regreso: '',
    Origen: 'Panamá',
    Destino: 'Pearl Island',
    Regresa_al_origen: true,
    Socio: '',
    Otro_usuario: '',
    Notas: '',
    Creado_por: ''
  });

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await supabaseRequest('reservations?order=Fecha_salida.asc');
      setReservations(data || []);
    } catch (error) {
      console.error('Error loading reservations:', error);
      alert('Error al cargar las reservaciones');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      Fecha_salida: '',
      hora_salida: '',
      Fecha_regreso: '',
      Hora_regreso: '',
      Origen: 'Panamá',
      Destino: 'Pearl Island',
      Regresa_al_origen: true,
      Socio: '',
      Otro_usuario: '',
      Notas: '',
      Creado_por: ''
    });
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formData.Fecha_salida || !formData.Fecha_regreso) {
      alert('Por favor ingrese las fechas de salida y regreso');
      return;
    }
    
    if (new Date(formData.Fecha_regreso) < new Date(formData.Fecha_salida)) {
      alert('La fecha de regreso debe ser mayor o igual a la fecha de salida');
      return;
    }
    
    if (!formData.Socio) {
      alert('Por favor seleccione un socio');
      return;
    }
    
    if (formData.Socio === 'Otro' && !formData.Otro_usuario.trim()) {
      alert('Por favor ingrese el nombre del otro usuario');
      return;
    }
    
    if (!formData.Creado_por) {
      alert('Por favor seleccione quién crea la reservación');
      return;
    }

    try {
      const reservationData = {
        Fecha_salida: formData.Fecha_salida,
        hora_salida: formData.hora_salida || null,
        Fecha_regreso: formData.Fecha_regreso,
        Hora_regreso: formData.Hora_regreso || null,
        Origen: formData.Origen,
        Destino: formData.Destino,
        Regresa_al_origen: formData.Regresa_al_origen,
        Socio: formData.Socio,
        Otro_usuario: formData.Otro_usuario || null,
        Notas: formData.Notas || null,
        Creado_por: formData.Creado_por
      };

      if (editingId) {
        await supabaseRequest(`reservations?id=eq.${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(reservationData),
        });
      } else {
        await supabaseRequest('reservations', {
          method: 'POST',
          body: JSON.stringify(reservationData),
        });
      }

      await loadReservations();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Error saving reservation:', error);
      alert('Error al guardar la reservación');
    }
  };

  const handleEdit = (reservation) => {
    setFormData({
      Fecha_salida: reservation.Fecha_salida,
      hora_salida: reservation.hora_salida || '',
      Fecha_regreso: reservation.Fecha_regreso,
      Hora_regreso: reservation.Hora_regreso || '',
      Origen: reservation.Origen,
      Destino: reservation.Destino,
      Regresa_al_origen: reservation.Regresa_al_origen,
      Socio: reservation.Socio,
      Otro_usuario: reservation.Otro_usuario || '',
      Notas: reservation.Notas || '',
      Creado_por: reservation.Creado_por
    });
    setEditingId(reservation.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await supabaseRequest(`reservations?id=eq.${id}`, {
        method: 'DELETE',
      });
      
      await loadReservations();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting reservation:', error);
      alert('Error al eliminar la reservación');
    }
  };

  const filteredReservations = reservations.filter(r => {
    if (showPastReservations) return true;
    return new Date(r.Fecha_regreso) >= new Date().setHours(0, 0, 0, 0);
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateTime = (dateString, timeString) => {
    const formatted = formatDate(dateString);
    if (timeString) {
      return `${formatted} ${timeString}`;
    }
    return formatted;
  };

  const getMonthDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getReservationsForDay = (day, month, year) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return reservations.filter(r => {
      const start = r.Fecha_salida;
      const end = r.Fecha_regreso;
      return dateStr >= start && dateStr <= end;
    });
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const generateICS = async (reservation) => {
    const formatICSDate = (dateString) => {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    };

    const formatICSDateTime = (dateString, timeString) => {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      if (timeString) {
        const [hours, minutes] = timeString.split(':');
        return `${year}${month}${day}T${hours}${minutes}00`;
      }
      return `${year}${month}${day}`;
    };

    const socioName = reservation.Socio === 'Otro' ? reservation.Otro_usuario : reservation.Socio;
    const title = `Reserva Yate - ${socioName}`;
    const location = `${reservation.Origen} → ${reservation.Destino}`;
    const description = [
      `Socio: ${socioName}`,
      `Origen: ${reservation.Origen}`,
      `Destino: ${reservation.Destino}`,
      reservation.Regresa_al_origen ? 'Ida y Vuelta: Sí' : '',
      reservation.Notas ? `Notas: ${reservation.Notas}` : '',
      `Creado por: ${reservation.Creado_por}`
    ].filter(Boolean).join('\\n');

    const startDateTime = formatICSDateTime(reservation.Fecha_salida, reservation.hora_salida);
    const endDateTime = formatICSDateTime(reservation.Fecha_regreso, reservation.Hora_regreso);
    const hasTime = reservation.hora_salida || reservation.Hora_regreso;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sistema Reservas Yate//ES',
      'BEGIN:VEVENT',
      `UID:${reservation.id}@yate-reservas`,
      `DTSTAMP:${formatICSDate(reservation.Fecha_salida)}`,
      hasTime ? `DTSTART:${startDateTime}` : `DTSTART;VALUE=DATE:${startDateTime}`,
      hasTime ? `DTEND:${endDateTime}` : `DTEND;VALUE=DATE:${endDateTime}`,
      `SUMMARY:${title}`,
      `LOCATION:${location}`,
      `DESCRIPTION:${description}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const fileName = `reserva-yate-${socioName}-${formatICSDate(reservation.Fecha_salida)}.ics`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], fileName, { type: 'text/calendar' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: title,
            text: `Reserva del yate: ${socioName}`
          });
          return;
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.log('Share failed, falling back to download');
        } else {
          return;
        }
      }
    }
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="mx-auto text-blue-600 mb-4 animate-pulse" size={64} />
          <p className="text-gray-600 text-lg">Cargando reservaciones...</p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {editingId ? 'Editar Reservación' : 'Nueva Reservación'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Salida *
                </label>
                <input
                  type="date"
                  value={formData.Fecha_salida}
                  onChange={(e) => setFormData({...formData, Fecha_salida: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora de Salida
                </label>
                <input
                  type="time"
                  value={formData.hora_salida}
                  onChange={(e) => setFormData({...formData, hora_salida: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Regreso *
                </label>
                <input
                  type="date"
                  value={formData.Fecha_regreso}
                  onChange={(e) => setFormData({...formData, Fecha_regreso: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.Fecha_salida && formData.Fecha_regreso && new Date(formData.Fecha_regreso) < new Date(formData.Fecha_salida) && (
                  <p className="text-red-600 text-sm mt-1">La fecha de regreso debe ser mayor o igual a la fecha de salida</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora de Regreso
                </label>
                <input
                  type="time"
                  value={formData.Hora_regreso}
                  onChange={(e) => setFormData({...formData, Hora_regreso: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Origen
                </label>
                <input
                  type="text"
                  value={formData.Origen}
                  onChange={(e) => setFormData({...formData, Origen: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destino
                </label>
                <input
                  type="text"
                  value={formData.Destino}
                  onChange={(e) => setFormData({...formData, Destino: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="regresaAlOrigen"
                checked={formData.Regresa_al_origen}
                onChange={(e) => setFormData({...formData, Regresa_al_origen: e.target.checked})}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="regresaAlOrigen" className="ml-2 text-sm font-medium text-gray-700">
                Ida y Vuelta
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Socio *
              </label>
              <select
                value={formData.Socio}
                onChange={(e) => setFormData({...formData, Socio: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione un socio</option>
                {socios.map(socio => (
                  <option key={socio} value={socio}>{socio}</option>
                ))}
                <option value="Otro">Otro</option>
              </select>
            </div>

            {formData.Socio === 'Otro' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Otro Usuario *
                </label>
                <input
                  type="text"
                  value={formData.Otro_usuario}
                  onChange={(e) => setFormData({...formData, Otro_usuario: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ingrese el nombre"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Creado Por *
              </label>
              <select
                value={formData.Creado_por}
                onChange={(e) => setFormData({...formData, Creado_por: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione quién crea la reserva</option>
                {socios.map(socio => (
                  <option key={socio} value={socio}>{socio}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                value={formData.Notas}
                onChange={(e) => setFormData({...formData, Notas: e.target.value})}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Comentarios adicionales..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
              >
                Guardar
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="text-blue-600" size={32} />
              Reservas del Yate
            </h1>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Nueva Reservación
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showPast"
                checked={showPastReservations}
                onChange={(e) => setShowPastReservations(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="showPast" className="ml-2 text-sm font-medium text-gray-700">
                Mostrar reservas pasadas
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 ${
                  view === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <List size={18} />
                <span className="hidden sm:inline">Lista</span>
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 ${
                  view === 'calendar' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Calendar size={18} />
                <span className="hidden sm:inline">Calendario</span>
              </button>
            </div>
          </div>
        </div>

        {view === 'calendar' ? (
          <CalendarView 
            reservations={reservations}
            currentMonth={currentMonth}
            navigateMonth={navigateMonth}
            getMonthDays={getMonthDays}
            getReservationsForDay={getReservationsForDay}
            setSelectedReservation={setSelectedReservation}
          />
        ) : (
          <ListView
            filteredReservations={filteredReservations}
            showPastReservations={showPastReservations}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            generateICS={generateICS}
            deleteConfirm={deleteConfirm}
            setDeleteConfirm={setDeleteConfirm}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
          />
        )}

        {selectedReservation && (
          <ReservationModal
            reservation={selectedReservation}
            onClose={() => setSelectedReservation(null)}
            onEdit={() => {
              handleEdit(selectedReservation);
              setSelectedReservation(null);
            }}
            onDelete={() => {
              setDeleteConfirm(selectedReservation.id);
              setSelectedReservation(null);
            }}
            onExport={() => {
              generateICS(selectedReservation);
            }}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
          />
        )}
      </div>
    </div>
  );
};

const CalendarView = ({ reservations, currentMonth, navigateMonth, getMonthDays, getReservationsForDay, setSelectedReservation }) => {
  const { daysInMonth, startingDayOfWeek, year, month } = getMonthDays(currentMonth);
  const monthName = currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const colors = ['bg-blue-100 border-blue-300', 'bg-green-100 border-green-300', 'bg-purple-100 border-purple-300', 'bg-orange-100 border-orange-300'];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 capitalize">{monthName}</h2>
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {days.map(day => (
          <div key={day} className="text-center font-semibold text-gray-600 text-xs md:text-sm py-2">
            {day}
          </div>
        ))}
        
        {calendarDays.map((day, index) => {
          const dayReservations = day ? getReservationsForDay(day, month, year) : [];
          const today = new Date();
          const isToday = day && 
            today.getDate() === day && 
            today.getMonth() === month && 
            today.getFullYear() === year;

          return (
            <div
              key={index}
              className={`min-h-16 md:min-h-24 border rounded-lg p-1 ${
                day ? 'bg-white' : 'bg-gray-50'
              } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
            >
              {day && (
                <>
                  <div className={`text-xs md:text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayReservations.slice(0, 3).map((reservation, i) => {
                      const socioName = reservation.Socio === 'Otro' ? reservation.Otro_usuario : reservation.Socio;
                      const colorClass = colors[i % colors.length];
                      return (
                        <div
                          key={reservation.id}
                          onClick={() => setSelectedReservation(reservation)}
                          className={`text-xs p-1 rounded border cursor-pointer hover:shadow-md transition-shadow ${colorClass}`}
                          title={socioName}
                        >
                          <div className="font-medium truncate">{socioName}</div>
                        </div>
                      );
                    })}
                    {dayReservations.length > 3 && (
                      <div className="text-xs text-gray-500 font-medium">
                        +{dayReservations.length - 3} más
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ListView = ({ filteredReservations, showPastReservations, handleEdit, handleDelete, generateICS, deleteConfirm, setDeleteConfirm, formatDate, formatDateTime }) => {
  if (filteredReservations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Calendar className="mx-auto text-gray-300 mb-4" size={64} />
        <p className="text-gray-500 text-lg">
          {showPastReservations ? 'No hay reservaciones' : 'No hay reservaciones futuras'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="md:hidden space-y-4">
        {filteredReservations.map(reservation => (
          <div key={reservation.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="font-bold text-lg text-gray-800">
                  {reservation.socio === 'Otro' ? reservation.otro_usuario : reservation.socio}
                </div>
                <div className="text-sm text-gray-600">
                  {formatDateTime(reservation.fecha_salida, reservation.hora_salida)} → {formatDateTime(reservation.fecha_regreso, reservation.hora_regreso)}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(reservation)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => generateICS(reservation)}
                  className="text-green-600 hover:text-green-800"
                  title="Exportar a Calendario"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={() => setDeleteConfirm(reservation.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Ruta:</span>
                <span className="font-medium">
                  {reservation.origen} → {reservation.destino}
                  {reservation.regresa_al_origen && ' (ida y vuelta)'}
                </span>
              </div>
              {reservation.notas && (
                <div className="text-gray-600 mt-2 pt-2 border-t">
                  {reservation.notas}
                </div>
              )}
              <div className="text-xs text-gray-500 mt-2">
                Creado por: {reservation.creado_por}
              </div>
            </div>

            {deleteConfirm === reservation.id && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-800 mb-2">
                  ¿Está seguro que desea eliminar esta reservación?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(reservation.id)}
                    className="flex-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha Salida</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha Regreso</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Socio</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ruta</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Notas</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Creado Por</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredReservations.map(reservation => (
              <React.Fragment key={reservation.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {formatDateTime(reservation.fecha_salida, reservation.hora_salida)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatDateTime(reservation.fecha_regreso, reservation.hora_regreso)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {reservation.socio === 'Otro' ? reservation.otro_usuario : reservation.socio}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {reservation.origen} → {reservation.destino}
                    {reservation.regresa_al_origen && <span className="text-gray-500"> (ida y vuelta)</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {reservation.notas ? (
                      reservation.notas.length > 50 
                        ? reservation.notas.substring(0, 50) + '...' 
                        : reservation.notas
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{reservation.creado_por}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(reservation)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => generateICS(reservation)}
                        className="text-green-600 hover:text-green-800"
                        title="Exportar a Calendario"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(reservation.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
                {deleteConfirm === reservation.id && (
                  <tr>
                    <td colSpan="7" className="px-4 py-3 bg-red-50">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-red-800">
                          ¿Está seguro que desea eliminar esta reservación?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(reservation.id)}
                            className="bg-red-600 text-white px-4 py-1 rounded text-sm hover:bg-red-700"
                          >
                            Sí, eliminar
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="bg-gray-300 text-gray-700 px-4 py-1 rounded text-sm hover:bg-gray-400"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

const ReservationModal = ({ reservation, onClose, onEdit, onDelete, onExport, formatDate, formatDateTime }) => {
  const socioName = reservation.socio === 'Otro' ? reservation.otro_usuario : reservation.socio;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-800">Detalles de Reservación</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <div>
            <span className="text-sm font-medium text-gray-600">Socio:</span>
            <p className="text-lg font-semibold text-gray-800">{socioName}</p>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-600">Fechas:</span>
            <p className="text-gray-800">
              {formatDateTime(reservation.fecha_salida, reservation.hora_salida)} → {formatDateTime(reservation.fecha_regreso, reservation.hora_regreso)}
            </p>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-600">Ruta:</span>
            <p className="text-gray-800">
              {reservation.origen} → {reservation.destino}
              {reservation.regresa_al_origen && ' (ida y vuelta)'}
            </p>
          </div>

          {reservation.notas && (
            <div>
              <span className="text-sm font-medium text-gray-600">Notas:</span>
              <p className="text-gray-800 whitespace-pre-wrap">{reservation.notas}</p>
            </div>
          )}

          <div>
            <span className="text-sm font-medium text-gray-600">Creado por:</span>
            <p className="text-gray-800">{reservation.creado_por}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onEdit}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
          >
            <Edit2 size={18} />
            Editar
          </button>
          <div className="flex gap-2">
            <button
              onClick={onExport}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Exportar
            </button>
            <button
              onClick={onDelete}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YachtReservationSystem;