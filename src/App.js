import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import fiLocale from '@fullcalendar/core/locales/fi';
import ReactModal from 'react-modal';
import './Calendar.css';


ReactModal.setAppElement('#root');

function Calendar() {
    // ... other state variables ...
    const [isChecked, setIsChecked] = useState(false);
    const calendarRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [events, setEvents] = useState();
    const [daysEvents, setDaysEvents] = useState();
    const [chatModalVisible, setChatModalVisible] = useState(false);
    const [sender, setSender] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatModalOpen, setChatModalOpen] = useState(false);
    const [clickedEventId, setClickedEventId] = useState(null);
    const handleOpenChatModal = async (eventId) => {
        try {
            const response = await fetch(`https://serveri-gopqbrbwda-oe.a.run.app/chatMessages?eventId=${eventId}`);
    
            if (!response.ok) {
                throw new Error('Failed to fetch chat messages');
            }
    
            const chatMessages = await response.json();
            // Update the state with the fetched chat messages
            setChatMessages(chatMessages);
        } catch (error) {
            console.error('An error occurred while fetching the chat messages:', error);
        }
    
        // Open the chat modal
        setChatModalOpen(true);
    };
    const handleDeleteEvent = () => {
        fetch(`https://serveri-gopqbrbwda-oe.a.run.app/events/${selectedEvent.id}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            console.log('Success:', data);
            // Remove the deleted event from the events state
            const updatedEvents = events.filter(event => event.id !== selectedEvent.id);
            setEvents(updatedEvents);
            setModalVisible(false);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    };
    

    const saveMessageToDatabase = async (eventId, senderName, senderMessage, sendTime) => {
        const response = await fetch('https://serveri-gopqbrbwda-oe.a.run.app/chatMessages',  {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                eventId,
                sender: senderName,
                message: senderMessage,
                timestamp: sendTime,
            }),
            
        });
    
        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        
    };

    const fetchMessagesFromDatabase = async (eventId) => {
        const response = await fetch(`https://serveri-gopqbrbwda-oe.a.run.app/chatMessages`);
        const allMessages = await response.json();
        console.log('Received messages:', allMessages); // Log the received messages
    
        // Filter the messages based on the eventId
        const filteredMessages = allMessages.filter(message => message.eventId === eventId);
    
        setMessages(filteredMessages); // Update the 'messages' state variable with the filtered messages
    };

    const handleEventClick = async (info) => {
        console.log("Event clicked: ", info);
        const event = info.event;
        setSelectedEvent(event);
        setClickedEventId(event.id);
        
        try {
            const response = await fetch(`https://serveri-gopqbrbwda-oe.a.run.app/events/${event.id}`);
            const eventData = await response.json();
            console.log("Event: ", eventData);
            setSelectedEvent({ 
                id: event.id, 
                title: eventData.title, 
                description: eventData.description, 
                starttime: eventData.starttime, 
                ketatulos: eventData.ketatulos, 
                start: eventData.start 
            });
            setModalVisible(true);
            setIsEditing(true);
        } catch (error) {
            console.error("Error:", error);
        }
    }

    const handleChatSubmit = async (eventId, senderName, senderMessage, sendTime) => {
        try {
            const requestBody = {
                eventId,
                sender: senderName,
                message: senderMessage,
                timestamp: sendTime,
            };
    
            console.log('Sending POST request to https://serveri-gopqbrbwda-oe.a.run.app/chatMessages with body:', requestBody);
            const response = await fetch('https://serveri-gopqbrbwda-oe.a.run.app/chatMessages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
    
            if (!response.ok) {
                const text = await response.text();
                console.error('Request failed with status ', response.status, ' and body ', text);
                throw new Error('Failed to send message');
            }
        } catch (error) {
            console.error('An error occurred while sending the message:', error);
        }
    };
    
    

    const convertEvents = (serverEvents) => {
        return serverEvents.map(event => ({
        id: event._id,
        title: event.title,
        description: event.description,
        ketatulos: event.ketatulos,
        start: new Date(event.start), 
        end: new Date(event.start).setHours(new Date(event.start).getHours() + 1), 
    }))};

    const handleDateClick = async (info) => {
        // info.dateStr will contain the date clicked in the format 'YYYY-MM-DD'
        setSelectedDate(info.dateStr);
        setSelectedEvent(null);
        setIsEditing(false);
        try {
            const response = await fetch(`https://serveri-gopqbrbwda-oe.a.run.app/events/date/${info.dateStr}`);
            const events = await response.json();
            const convertedEvents = convertEvents(events);
            setDaysEvents(convertedEvents); // Set the events of the selected day
            setModalVisible(true);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleEventSubmit = (e) => {
        console.log('handleEventSubmit')
        e.preventDefault();
    
        if (isEditing) {
            // Create an object with the updated event data
            const updatedEvent = {
                title: selectedEvent.title,
                start: selectedEvent.start,
                description: selectedEvent.description,
                starttime: selectedEvent.starttime,
                ketatulos: selectedEvent.ketatulos,
            };
            const newEvent = {
                title: selectedEvent.title,
                start: selectedDate,
                description: selectedEvent.description,
                starttime: selectedEvent.starttime,
                ketatulos: selectedEvent.ketatulos,
            };
            fetch(`https://serveri-gopqbrbwda-oe.a.run.app/events/${selectedEvent.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedEvent),
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                console.log('Success:', data);
                // Update the event in the events state
                const updatedEvents = events.map(event => event.id === selectedEvent.id ? {...event, ...updatedEvent} : event);
                setEvents(updatedEvents);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    
        } else {
            const newEvent = {
                title: selectedEvent.title,
                start: selectedDate,
                description: selectedEvent.description,
                starttime: selectedEvent.starttime,
                ketatulos: selectedEvent.ketatulos,
            };
    
            // Send a POST request to the server to create a new event
            fetch('https://serveri-gopqbrbwda-oe.a.run.app/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newEvent),
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                const createdEvent = data;
                console.log('Success:', events);
                const convertedEvents = convertEvents([createdEvent]);
                setEvents([...events, ...convertedEvents]);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        }
    
        setModalVisible(false);
    };

    const fetchEvents = async () => {
        fetch('https://serveri-gopqbrbwda-oe.a.run.app/events')
          .then(response => response.json())
          .then(data => {
            data.forEach(event => {
                console.log(new Date(event.start))

            })
            const convertedEvents = convertEvents(data);
            return setEvents(convertedEvents)})
          .catch(error => console.error('Error:', error));
    }

    useEffect(() => {
        if (!events) {
            console.log('fetching events')
            fetchEvents()
        }
        
    }, [events]);

    const changeInput = (key, value) => {
        setSelectedEvent({ ...selectedEvent, [key]: value });
    }

    return (
        <div>
    <ReactModal
    isOpen={modalVisible}
    onRequestClose={() => setModalVisible(false)}
    contentLabel="Event Details"
    style={{
        overlay: {
            zIndex: 1000
        }
    }}
>
            
                <h2>Event Details</h2>
                <form onSubmit={handleEventSubmit}>
                    <div>  
                        <label>
                            Title:
                            <input type="text" value={(selectedEvent && selectedEvent.title) || ''} onChange={e => changeInput('title', e.target.value)} />
                        </label>
                    </div>
                    <div>
                        <label>
                            Description:
                            <input type="text" value={(selectedEvent && selectedEvent.description) || ''} onChange={e => changeInput('description', e.target.value)} />
                        </label>
                    </div>      
                    <div>
                        <label>
                            Start time:
                            <input type="text" value={(selectedEvent && selectedEvent.starttime) || ''} onChange={e => changeInput('starttime', e.target.value)} />
                        </label>
                    </div>      
                    <div>
                        <label>
                            Ketä tulos:
                            <input type="text" value={(selectedEvent && selectedEvent.ketatulos) || ''} onChange={e => changeInput('ketatulos', e.target.value)} />
                        </label>
                    </div>      
                    <button type="submit" style={{backgroundColor: '#3a87ad', color: 'white'}}>
                        {isEditing ? 'Save Changes' : 'Add Event'}
                    </button>
                    {selectedEvent && selectedEvent.id && 
    <button onClick={() => {
        handleOpenChatModal(clickedEventId);
        setChatModalVisible(true);
        fetchMessagesFromDatabase(clickedEventId);
    }}>Open Chat</button>
}
                </form>
                <button onClick={() => setModalVisible(false)}>Close</button>
                {isEditing &&<button onClick={handleDeleteEvent} style={{backgroundColor: '#f00', color: 'white'}}>Delete Event</button>}

            </ReactModal>
            {selectedEvent &&  
                <ReactModal
                isOpen={chatModalVisible}
                onRequestClose={() => setChatModalVisible(false)}
                contentLabel="Chat Modal"
                style={{
                    overlay: {
                        zIndex: 1000
                    }
                }}
            >
                <h2>Chat Modal</h2>
                <input type="text" value={sender} onChange={e => setSender(e.target.value)} placeholder="Sender's name (optional)" />
                <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Message" required />
                <button onClick={() => {
                const newMessage = { eventId: clickedEventId, sender: sender, message: message };
                saveMessageToDatabase(clickedEventId, sender, message);
                setMessage('');
                setMessages(prevMessages => [...prevMessages, newMessage]);
}}>
    Send
</button>
                <button onClick={() => setChatModalVisible(false)}>
                    Close
                </button>
                <div>
                    {messages.map((msg, index) => (
                        <p key={index}><strong>{msg.sender}:</strong> {msg.message}</p>
                    ))}
                </div>
            </ReactModal>
}
            <FullCalendar
  ref={calendarRef}
  plugins={[dayGridPlugin, interactionPlugin]}
  displayEventTime={false}
  initialView="dayGridMonth"
  selectable={true}
  events={events} // pass the events here
  dateClick={handleDateClick}
  eventClick={handleEventClick}
  locale={fiLocale}
/>
        </div>
    );
}

export default Calendar;