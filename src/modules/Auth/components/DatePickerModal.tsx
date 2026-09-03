import React, { useState, useRef, useEffect } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, FlatList, ScrollView } from 'react-native';
import { Colors, Radius, Shadows, Spacing } from '@/shared/theme';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (dateStr: string) => void;
}

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const MONTH_SHORT = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sept', 'oct', 'nov', 'dic'
];

const DAYS_OF_WEEK = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'];

// Rango de años para personas de todas las edades (desde 1940 hasta el año actual)
const currentFullYear = new Date().getFullYear();
const YEARS_LIST: number[] = [];
for (let y = currentFullYear; y >= 1940; y--) {
  YEARS_LIST.push(y);
}

export function DatePickerModal({ visible, onClose, onSelectDate }: DatePickerModalProps) {
  const [currentYear, setCurrentYear] = useState(2000);
  const [currentMonth, setCurrentMonth] = useState(0); // Enero
  const [viewMode, setViewMode] = useState<'days' | 'months_years'>('days');

  // Al abrir el modal, asegurar vista de días
  useEffect(() => {
    if (visible) {
      setViewMode('days');
    }
  }, [visible]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formattedDay = day.toString().padStart(2, '0');
    const formattedMonth = (currentMonth + 1).toString().padStart(2, '0');
    onSelectDate(`${formattedDay}/${formattedMonth}/${currentYear}`);
    onClose();
  };

  const handleSetToday = () => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    onSelectDate(`${day}/${month}/${now.getFullYear()}`);
    onClose();
  };

  const handleClear = () => {
    onSelectDate('');
    onClose();
  };

  // Calcular días en el mes
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;

  const daysGrid: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysGrid.push(i);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={dpStyles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={dpStyles.calendarCard}>
          {/* Header del Calendario con botón desplegable de Mes/Año */}
          <View style={dpStyles.headerRow}>
            <TouchableOpacity
              style={dpStyles.monthSelector}
              onPress={() => setViewMode(viewMode === 'days' ? 'months_years' : 'days')}
              activeOpacity={0.7}
            >
              <Text style={dpStyles.monthTitle}>
                {MONTH_NAMES[currentMonth]} de {currentYear}
              </Text>
              <Text style={dpStyles.dropdownArrow}>{viewMode === 'days' ? ' ▾' : ' ▴'}</Text>
            </TouchableOpacity>

            {viewMode === 'days' ? (
              <View style={dpStyles.arrowsRow}>
                <TouchableOpacity style={dpStyles.arrowBtn} onPress={prevMonth}>
                  <Text style={dpStyles.arrowText}>↑</Text>
                </TouchableOpacity>
                <TouchableOpacity style={dpStyles.arrowBtn} onPress={nextMonth}>
                  <Text style={dpStyles.arrowText}>↓</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {/* VISTA 1: Selector Rápido de AÑO y MES (Fiel al screenshot) */}
          {viewMode === 'months_years' ? (
            <View style={dpStyles.yearMonthContainer}>
              {/* Cuadrícula de 12 Meses */}
              <View style={dpStyles.monthsGrid}>
                {MONTH_SHORT.map((m, idx) => {
                  const isSelected = idx === currentMonth;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[dpStyles.monthBtn, isSelected && dpStyles.monthBtnSelected]}
                      onPress={() => {
                        setCurrentMonth(idx);
                        setViewMode('days');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[dpStyles.monthBtnText, isSelected && dpStyles.monthBtnTextSelected]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Lista Scrollable de Años */}
              <Text style={dpStyles.yearSectionTitle}>Selecciona el Año:</Text>
              <ScrollView style={dpStyles.yearsScrollView} showsVerticalScrollIndicator={true}>
                {YEARS_LIST.map((y) => {
                  const isSelectedYear = y === currentYear;
                  return (
                    <TouchableOpacity
                      key={y}
                      style={[dpStyles.yearItem, isSelectedYear && dpStyles.yearItemSelected]}
                      onPress={() => {
                        setCurrentYear(y);
                        // Permanece para elegir mes o volver
                      }}
                    >
                      <Text style={[dpStyles.yearItemText, isSelectedYear && dpStyles.yearItemTextSelected]}>
                        {y}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={dpStyles.backToDaysBtn}
                onPress={() => setViewMode('days')}
                activeOpacity={0.8}
              >
                <Text style={dpStyles.backToDaysText}>Listo, ver días →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* VISTA 2: Días del Mes */
            <View>
              {/* Días de la Semana */}
              <View style={dpStyles.daysOfWeekRow}>
                {DAYS_OF_WEEK.map((d) => (
                  <Text key={d} style={dpStyles.dayOfWeekText}>
                    {d}
                  </Text>
                ))}
              </View>

              {/* Cuadrícula de Días */}
              <View style={dpStyles.daysGrid}>
                {daysGrid.map((d, index) => (
                  <View key={index} style={dpStyles.dayCell}>
                    {d !== null ? (
                      <TouchableOpacity
                        style={dpStyles.dayButton}
                        onPress={() => handleSelectDay(d)}
                        activeOpacity={0.7}
                      >
                        <Text style={dpStyles.dayText}>{d}</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={dpStyles.emptyCell} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Footer con Borrar y Hoy */}
          <View style={dpStyles.footerRow}>
            <TouchableOpacity onPress={handleClear}>
              <Text style={dpStyles.footerActionText}>Borrar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSetToday}>
              <Text style={dpStyles.footerActionText}>Hoy</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const dpStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  calendarCard: {
    width: 310,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: 4,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EADA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2B241C',
    textTransform: 'capitalize',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#B5551A',
    fontWeight: '900',
    marginLeft: 2,
  },
  arrowsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  arrowBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F3EADA',
  },
  arrowText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2B241C',
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EADA',
    paddingBottom: 4,
  },
  dayOfWeekText: {
    width: 36,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#7A6E5C',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2B241C',
  },
  emptyCell: {
    width: 30,
    height: 30,
  },
  // Estilos de Vista Mes / Año (Fiel al screenshot del prototipo)
  yearMonthContainer: {
    paddingVertical: 4,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 10,
  },
  monthBtn: {
    width: '23%',
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#FBF6EE',
    borderWidth: 1,
    borderColor: '#EAE0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthBtnSelected: {
    backgroundColor: '#4A4A4A',
    borderColor: '#222222',
  },
  monthBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2B241C',
  },
  monthBtnTextSelected: {
    color: '#FFFFFF',
  },
  yearSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A6E5C',
    marginBottom: 4,
  },
  yearsScrollView: {
    height: 110,
    backgroundColor: '#F7F2EA',
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  yearItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE0D0',
    alignItems: 'center',
  },
  yearItemSelected: {
    backgroundColor: '#E6D7C3',
    borderRadius: 4,
  },
  yearItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2B241C',
  },
  yearItemTextSelected: {
    color: '#B5551A',
    fontWeight: '900',
  },
  backToDaysBtn: {
    marginTop: 8,
    backgroundColor: '#B5551A',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  backToDaysText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F3EADA',
    paddingTop: Spacing.xs,
  },
  footerActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2980B9',
  },
});
