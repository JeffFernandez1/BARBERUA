import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Habilitar LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Configuración del calendario en español
LocaleConfig.locales['es'] = {
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthNamesShort: ['Ene.','Feb.','Mar.','Abr.','May.','Jun.','Jul.','Ago.','Sep.','Oct.','Nov.','Dic.'],
  dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  dayNamesShort: ['Dom.','Lun.','Mar.','Mié.','Jue.','Vie.','Sáb.'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

// Paleta de colores
const COLORS = {
  primary: '#5D3FD3',
  secondary: '#FF6347',
  background: '#F4F6F8',
  text: '#333333',
  white: '#FFFFFF',
  lightGray: '#E0E0E0',
  darkGray: '#888888',
  success: '#4CAF50',
  danger: '#F44336',
};

export default function App() {
  const [sales, setSales] = useState([]);
  const [services, setServices] = useState([
    {id: '1', name: 'Corte de Cabello', price: 20},
    {id: '2', name: 'Diseño de Barba', price: 15},
    {id: '3', name: 'Tinte Capilar', price: 50},
  ]);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [editingService, setEditingService] = useState(null);
  const [salesDate, setSalesDate] = useState(new Date());
  const [calendarStatus, setCalendarStatus] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [notes, setNotes] = useState({});
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [expandedNoteId, setExpandedNoteId] = useState(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [monthlySales, setMonthlySales] = useState(0);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const total = sales
      .filter(sale => {
        const saleDate = new Date(sale.isoDate);
        return saleDate.getMonth() === currentCalendarMonth.getMonth() &&
               saleDate.getFullYear() === currentCalendarMonth.getFullYear();
      })
      .reduce((sum, sale) => sum + sale.price, 0);
    setMonthlySales(total);
  }, [sales, currentCalendarMonth]);

  const confirmAndRegisterSale = (service) => {
    Alert.alert("Confirmar Venta", `¿Deseas registrar la venta de "${service.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Registrar",
          onPress: () => {
            const now = new Date();
            setSales(prevSales => [...prevSales, {
              id: Date.now().toString(),
              service: service.name,
              price: service.price,
              date: now.toLocaleDateString('es-ES'),
              time: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
              isoDate: now.toISOString()
            }]);
            setSalesDate(now);
            setCurrentScreen('ventas');
          }
        }
      ]
    );
  };

  const onDayPress = (day) => {
    const date = day.dateString;
    const currentStatus = calendarStatus[date]?.status;
    let newCalendarStatus = { ...calendarStatus };

    if (currentStatus === 'open') {
      newCalendarStatus[date].status = 'closed';
    } else if (currentStatus === 'closed') {
      delete newCalendarStatus[date];
    } else {
      newCalendarStatus[date] = { status: 'open' };
    }

    setCalendarStatus(newCalendarStatus);
    
    setSelectedDay(date);
    setShowNoteForm(false);
    setNoteTitle('');
    setNoteContent('');
  };

  const getMarkedDatesForCalendar = () => {
    const marked = {};
    Object.entries(calendarStatus).forEach(([date, { status }]) => {
      marked[date] = { selected: true, selectedColor: status === 'open' ? COLORS.success : COLORS.danger };
    });
    Object.keys(notes).forEach(date => {
        if (notes[date] && notes[date].length > 0) {
            marked[date] = { ...marked[date], marked: true, dotColor: COLORS.secondary };
        }
    });
    if (selectedDay) {
        marked[selectedDay] = {
            ...marked[selectedDay],
            selected: true,
            selectedColor: marked[selectedDay]?.selectedColor || COLORS.primary,
        };
    }
    return marked;
  };

  const handleAddOrUpdateService = () => {
    if (!serviceName || !servicePrice) return;
    if (editingService) {
      setServices(services.map(s => s.id === editingService.id ? { ...s, name: serviceName, price: parseFloat(servicePrice) } : s ));
    } else {
      setServices([...services, { id: Date.now().toString(), name: serviceName, price: parseFloat(servicePrice) }]);
    }
    cancelEditing();
  };

  const startEditing = (service) => {
    setEditingService(service);
    setServiceName(service.name);
    setServicePrice(service.price.toString());
  };

  const cancelEditing = () => {
    setEditingService(null);
    setServiceName('');
    setServicePrice('');
  };

  const confirmAndDeleteService = (id) => {
    Alert.alert("Confirmar", "¿Estás seguro de que deseas eliminar este servicio?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => setServices(services.filter(s => s.id !== id)) }
    ]);
  };

  const handleAddNote = () => {
    if (!noteTitle || !noteContent) {
      Alert.alert("Error", "El título y el contenido de la nota no pueden estar vacíos.");
      return;
    }
    const newNote = {
      id: Date.now().toString(),
      title: noteTitle,
      content: noteContent,
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
    const dayNotes = notes[selectedDay] || [];
    setNotes({ ...notes, [selectedDay]: [...dayNotes, newNote] });
    setNoteTitle('');
    setNoteContent('');
    setShowNoteForm(false);
  };

  const toggleNoteExpansion = (noteId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedNoteId(expandedNoteId === noteId ? null : noteId);
  };

  const MenuButton = ({ title, icon, onPress, delay }) => (
    <Animatable.View animation="fadeInUp" duration={500} delay={delay}>
      <TouchableOpacity style={styles.menuButton} onPress={onPress}>
        <Icon name={icon} size={24} color={COLORS.primary} />
        <Text style={styles.menuButtonText}>{title}</Text>
      </TouchableOpacity>
    </Animatable.View>
  );

  const BackButton = () => (
    <TouchableOpacity style={styles.backButton} onPress={() => { cancelEditing(); setCurrentScreen('menu'); }}>
      <Icon name="arrow-left" size={20} color={COLORS.primary} />
      <Text style={styles.backButtonText}>Volver al Menú</Text>
    </TouchableOpacity>
  );

  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return (
          <View style={styles.menuContainer}>
            <Animatable.Text animation="fadeInDown" style={styles.title}>Mi Negocio</Animatable.Text>
            <MenuButton title="Registrar Venta" icon="cash-register" onPress={() => setCurrentScreen('home')} delay={100} />
            <MenuButton title="Ver Ventas" icon="chart-line" onPress={() => setCurrentScreen('ventas')} delay={200} />
            <MenuButton title="Gestionar Servicios" icon="format-list-bulleted" onPress={() => setCurrentScreen('precios')} delay={300} />
            <MenuButton title="Calendario y Notas" icon="calendar-month" onPress={() => setCurrentScreen('calendario')} delay={400} />
          </View>
        );

      case 'home':
        return (
          <>
            <BackButton />
            <Text style={styles.title}>Registrar Venta</Text>
            <FlatList
              data={services}
              keyExtractor={item => item.id}
              renderItem={({ item, index }) => (
                <Animatable.View animation="fadeIn" delay={index * 100}>
                  <TouchableOpacity style={styles.card} onPress={() => confirmAndRegisterSale(item)}>
                    <Icon name="tag-outline" size={24} color={COLORS.primary} />
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                      <Text style={styles.cardSubtitle}>S/. {item.price.toFixed(2)}</Text>
                    </View>
                    <Icon name="chevron-right" size={24} color={COLORS.darkGray} />
                  </TouchableOpacity>
                </Animatable.View>
              )}
            />
          </>
        );

      case 'ventas':
        const filteredSales = sales.filter(s => new Date(s.isoDate).toLocaleDateString('es-ES') === salesDate.toLocaleDateString('es-ES'));
        const totalDelDia = filteredSales.reduce((sum, sale) => sum + sale.price, 0);

        return (
            <>
                <BackButton />
                <Text style={styles.title}>Ventas Realizadas</Text>
                <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
                    <Icon name="calendar" size={20} color={COLORS.primary} />
                    <Text style={styles.datePickerButtonText}>Fecha: {salesDate.toLocaleDateString('es-ES')}</Text>
                </TouchableOpacity>
                {showDatePicker && (<DateTimePicker value={salesDate} mode="date" display="default" onChange={(event, date) => { setShowDatePicker(false); if (date) setSalesDate(date); }} />)}
                <Animatable.View animation="zoomIn" style={[styles.card, styles.summaryCard]}>
                    <Text style={styles.summaryCardTitle}>Total del Día</Text>
                    <Text style={styles.summaryCardAmount}>S/. {totalDelDia.toFixed(2)}</Text>
                </Animatable.View>
                <FlatList
                    data={filteredSales}
                    keyExtractor={(item) => item.id}
                    ListEmptyComponent={<Animatable.Text animation="fadeIn" style={styles.emptyText}>No hay ventas para esta fecha.</Animatable.Text>}
                    renderItem={({ item, index }) => (
                        <Animatable.View animation="fadeInUp" delay={index * 50} style={styles.card}>
                            <Icon name="receipt" size={30} color={COLORS.secondary} />
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>{item.service}</Text>
                                <Text style={styles.cardTimestamp}>{item.time}</Text>
                            </View>
                            <Text style={styles.priceText}>S/. {item.price.toFixed(2)}</Text>
                        </Animatable.View>
                    )}
                />
            </>
        );

      case 'precios':
        return (
          <>
            <BackButton />
            <Text style={styles.title}>{editingService ? 'Editando Servicio' : 'Gestionar Servicios'}</Text>
            <View style={styles.inputContainer}><TextInput style={styles.input} placeholder="Nombre del servicio" value={serviceName} onChangeText={setServiceName} /><TextInput style={styles.input} placeholder="Precio" keyboardType="numeric" value={servicePrice} onChangeText={setServicePrice} /><View style={{flexDirection: 'row'}}>{editingService ? (<><TouchableOpacity style={[styles.button, {backgroundColor: COLORS.success, marginRight: 10}]} onPress={handleAddOrUpdateService}><Text style={styles.buttonText}>Actualizar</Text></TouchableOpacity><TouchableOpacity style={[styles.button, {backgroundColor: COLORS.darkGray}]} onPress={cancelEditing}><Text style={styles.buttonText}>Cancelar</Text></TouchableOpacity></>) : (<TouchableOpacity style={[styles.button, {backgroundColor: COLORS.primary}]} onPress={handleAddOrUpdateService}><Text style={styles.buttonText}>Agregar Servicio</Text></TouchableOpacity>)}</View></View>
            <Text style={styles.subtitle}>Lista de Servicios</Text>
            <FlatList
              data={services}
              keyExtractor={item => item.id}
              renderItem={({item, index}) => (
                <Animatable.View animation="fadeIn" delay={index * 100} style={styles.card}>
                    <View style={styles.cardContent}><Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.cardSubtitle}>S/. {item.price.toFixed(2)}</Text></View>
                    <View style={{flexDirection: 'row'}}><TouchableOpacity onPress={() => startEditing(item)} style={{marginRight: 15}}><Icon name="pencil" size={22} color={COLORS.primary} /></TouchableOpacity><TouchableOpacity onPress={() => confirmAndDeleteService(item.id)}><Icon name="delete" size={22} color={COLORS.danger} /></TouchableOpacity></View>
                </Animatable.View>
              )}
            />
          </>
        );

      case 'calendario':
        const notesForSelectedDay = selectedDay ? (notes[selectedDay] || []) : [];
        return (
          <>
            <BackButton />
            <Text style={styles.title}>Calendario y Notas</Text>
            <ScrollView>
              <Animatable.View animation="zoomIn" style={[styles.card, styles.summaryCard]}>
                  <Text style={styles.summaryCardTitle}>Ventas de {currentCalendarMonth.toLocaleString('es-ES', { month: 'long' })}</Text>
                  <Text style={styles.summaryCardAmount}>S/. {monthlySales.toFixed(2)}</Text>
              </Animatable.View>
              <Calendar onDayPress={onDayPress} onMonthChange={(month) => setCurrentCalendarMonth(new Date(month.dateString))} markedDates={getMarkedDatesForCalendar()} theme={{backgroundColor: COLORS.background, calendarBackground: COLORS.white, textSectionTitleColor: COLORS.primary, selectedDayBackgroundColor: COLORS.primary, selectedDayTextColor: COLORS.white, todayTextColor: COLORS.secondary, dayTextColor: COLORS.text, arrowColor: COLORS.primary, monthTextColor: COLORS.primary, textDayFontWeight: '300', textMonthFontWeight: 'bold', textDayHeaderFontWeight: 'bold', textDayFontSize: 16, textMonthFontSize: 18, textDayHeaderFontSize: 14}}/>
              {selectedDay && (
                <Animatable.View animation="fadeInUp" style={styles.notesSection}>
                  <Text style={styles.subtitle}>Notas para {selectedDay}</Text>
                  <TouchableOpacity style={[styles.button, {backgroundColor: COLORS.secondary, marginBottom: 15}]} onPress={() => setShowNoteForm(!showNoteForm)}><Text style={styles.buttonText}>{showNoteForm ? 'Ocultar Formulario' : 'Añadir Nueva Nota'}</Text></TouchableOpacity>
                  {showNoteForm && (<View style={styles.inputContainer}><TextInput style={styles.input} placeholder="Título de la nota" value={noteTitle} onChangeText={setNoteTitle}/><TextInput style={[styles.input, {height: 100, textAlignVertical: 'top'}]} placeholder="Contenido..." value={noteContent} onChangeText={setNoteContent} multiline/><TouchableOpacity style={[styles.button, {backgroundColor: COLORS.primary}]} onPress={handleAddNote}><Text style={styles.buttonText}>Guardar Nota</Text></TouchableOpacity></View>)}
                  {notesForSelectedDay.length > 0 ? (
                    notesForSelectedDay.map(note => (
                      <TouchableOpacity key={note.id} style={styles.noteCard} onPress={() => toggleNoteExpansion(note.id)}>
                        <View style={styles.noteHeader}><Text style={styles.noteTitle}>{note.title}</Text><Icon name={expandedNoteId === note.id ? 'chevron-up' : 'chevron-down'} size={24} color={COLORS.primary} /></View>
                        {expandedNoteId === note.id && (<View style={styles.noteContent}><Text>{note.content}</Text><Text style={styles.noteTimestamp}>{note.time}</Text></View>)}
                      </TouchableOpacity>
                    ))
                  ) : ( <Text style={styles.emptyText}>No hay notas para este día.</Text> )}
                </Animatable.View>
              )}
            </ScrollView>
          </>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      {renderScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20 },
  menuContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginVertical: 20 },
  subtitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 20, marginBottom: 10, textAlign: 'center' },
  menuButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingVertical: 15, paddingHorizontal: 20, borderRadius: 15, marginBottom: 15, width: '100%', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, },
  menuButtonText: { fontSize: 18, color: COLORS.primary, marginLeft: 15, fontWeight: '600' },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 10 },
  backButtonText: { color: COLORS.primary, fontSize: 16, marginLeft: 5, fontWeight: 'bold' },
  card: { backgroundColor: COLORS.white, borderRadius: 15, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, },
  cardContent: { flex: 1, marginLeft: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  cardSubtitle: { fontSize: 16, color: COLORS.darkGray },
  summaryCard: { backgroundColor: COLORS.primary, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingVertical: 20, marginBottom: 20 },
  summaryCardTitle: { color: COLORS.white, fontSize: 16, fontWeight: '600'},
  summaryCardAmount: { color: COLORS.white, fontSize: 26, fontWeight: 'bold', marginTop: 5 },
  inputContainer: { backgroundColor: COLORS.white, borderRadius: 15, padding: 20, marginVertical: 10, elevation: 2 },
  input: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 10, padding: 15, marginBottom: 15, fontSize: 16, },
  button: { paddingVertical: 15, borderRadius: 10, alignItems: 'center', flex: 1 },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: COLORS.darkGray },
  priceText: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  cardTimestamp: { fontSize: 14, color: COLORS.darkGray, marginTop: 4 },
  datePickerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 15, borderRadius: 10, elevation: 2, justifyContent: 'center' },
  datePickerButtonText: { fontSize: 16, color: COLORS.primary, marginLeft: 10, fontWeight: '600' },
  notesSection: { marginTop: 20, paddingBottom: 50 },
  noteCard: { backgroundColor: COLORS.white, borderRadius: 10, padding: 15, marginBottom: 10, elevation: 2, },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', },
  noteTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, },
  noteContent: { marginTop: 10, borderTopWidth: 1, borderTopColor: COLORS.lightGray, paddingTop: 10, },
  noteTimestamp: { fontSize: 12, color: COLORS.darkGray, textAlign: 'right', marginTop: 10, },
});