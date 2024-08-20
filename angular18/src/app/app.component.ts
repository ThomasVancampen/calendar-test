import { Component, signal, ChangeDetectorRef, model, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventClickArg, EventApi } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { INITIAL_EVENTS, createEventId } from './event-utils';
import { MatDatepickerModule } from '@angular/material/datepicker'; 
import { MatCardModule } from '@angular/material/card';
import { provideNativeDateAdapter } from '@angular/material/core';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FullCalendarModule, MatDatepickerModule, MatCardModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  selected = model<Date | null>(null);
  calendarVisible = signal(true);
  @ViewChild('fullCalendar', { static: false }) calendarComponent: FullCalendarComponent | undefined;

  calendarOptions = signal<CalendarOptions>({
    plugins: [
      interactionPlugin,
      dayGridPlugin,
      timeGridPlugin,
      listPlugin,
    ],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    initialView: 'timeGridWeek',
    initialEvents: INITIAL_EVENTS,
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventsSet: this.handleEvents.bind(this),
  });

  currentEvents = signal<EventApi[]>([]);
  highlightEventId: string | null = null; // To keep track of the highlight event

  constructor(private changeDetector: ChangeDetectorRef) {}

  handleCalendarToggle() {
    this.calendarVisible.update((bool) => !bool);
  }

  handleWeekendsToggle() {
    this.calendarOptions.update((options) => ({
      ...options,
      weekends: !options.weekends,
    }));
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    const title = prompt('Please enter a new title for your event');
    const calendarApi = selectInfo.view.calendar;

    calendarApi.unselect();

    if (title) {
      calendarApi.addEvent({
        id: createEventId(),
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay,
      });
    }
  }

  handleEventClick(clickInfo: EventClickArg) {
    if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
      clickInfo.event.remove();
    }
  }

  handleEvents(events: EventApi[]) {
    this.currentEvents.set(events);
    this.changeDetector.detectChanges();
  }

  handleDateSelection(date: Date | null) {
    if (date) {
      const formattedDate = formatDate(date, 'yyyy-MM-dd', 'en-US');
      console.log('Selected Date:', formattedDate);

      const calendarApi = this.calendarComponent!.getApi();

      // Remove the previous highlight event
      if (this.highlightEventId) {
        const event = calendarApi.getEventById(this.highlightEventId);
        if (event) {
          event.remove();
        }
      }

      // Add a new highlight event
      const highlightEvent = calendarApi.addEvent({
        id: createEventId(),
        title: 'Selected Day',
        start: formattedDate,
        end: formattedDate,
        display: 'background', // This makes the event appear as a background highlight
        color: '#ff9f89', // Custom color for the highlight
      });

      this.highlightEventId = highlightEvent!.id;

      calendarApi.gotoDate(formattedDate); // Navigate to the selected date
      calendarApi.changeView('timeGridWeek'); // Switch to week view
    }
  }
}
