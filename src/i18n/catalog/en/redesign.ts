import type { Fragment } from "../types";

/**
 * The redesign (arm A of `app_design`): Today, the Garage tab, the vehicle
 * screen's To-do / Care plan / History, and the mascot's lines.
 *
 * The mascot speaks in the first person ("I'll keep watch") in exactly one
 * place, the empty garage, where there is nothing else to say. Everywhere else
 * the copy states the schedule; the face does the feeling.
 */
export const redesign: Fragment = {
  "redesign.tab.today": "Today",
  "redesign.tab.garage": "Garage",
  "redesign.plus": "Log a service",

  "redesign.greeting.morning": "Good morning",
  "redesign.greeting.afternoon": "Good afternoon",
  "redesign.greeting.evening": "Good evening",
  "redesign.greeting.morning.named": "Good morning, {name}",
  "redesign.greeting.afternoon.named": "Good afternoon, {name}",
  "redesign.greeting.evening.named": "Good evening, {name}",

  "redesign.status.sleepy": "Log your first service and I'll keep watch from here.",
  "redesign.status.happy": "Everything is on schedule. Nothing to do today.",
  "redesign.status.headsUp": {
    one: "{count} service is coming up soon.",
    other: "{count} services are coming up soon.",
  },
  "redesign.status.worried": {
    one: "{count} service is overdue.",
    other: "{count} services are overdue.",
  },

  "redesign.summary.overdue": "Overdue",
  "redesign.summary.soon": "Due soon",
  "redesign.summary.onTrack": "On track",

  "redesign.segment.today": "Today",
  "redesign.segment.upcoming": "Upcoming",
  "redesign.todayTasks": "Today's tasks",
  "redesign.allDone.title": "All caught up",
  "redesign.allDone.body": "New tasks will show up here",
  "redesign.upcoming.empty": "Nothing scheduled yet. Log a service and the plan fills in.",
  "redesign.check": "Log {service} as done",
  "redesign.task.on": "{vehicle} · {detail}",

  "redesign.garage.empty": "No car yet. Add one and its plan starts here.",
  "redesign.garage.next": "Next: {service} · {when}",
  "redesign.garage.nothingTracked": "Nothing tracked yet",

  "redesign.car.tab.todo": "To-do",
  "redesign.car.tab.plan": "Care plan",
  "redesign.car.tab.history": "History",
  "redesign.car.next": "{service}: {when}",
  "redesign.car.last": "Last: {date}",
  "redesign.car.firstLog": "Log the last service you had done",
  "redesign.car.nothingDue": "Nothing due",
  "redesign.car.nothingDue.body": "Next up: {service}, {when}.",
  "redesign.car.health": "Interval left",
  "redesign.car.basedOn": "Schedule is based on",
  "redesign.car.complete": "Plan {percent}% complete",
  "redesign.car.gap.odometer": "Add your odometer to make it more accurate",
  "redesign.car.gap.service": "Log your last {service} to make it more accurate",
  "redesign.car.notLogged": "Not logged yet",
  "redesign.car.editIntervals": "Edit intervals",

  "redesign.celebrate.title": "Logged!",
  "redesign.celebrate.body": "{service} is on the record.",

  // The car's line at the top of each onboarding screen (src/onboarding/convoLine.ts).
  // It reacts to the last answer; the screen's title asks the next question.
  "redesign.convo.name": "Hi, I'm Wrenchy. I'll keep your car on schedule.",
  "redesign.convo.vehicle": "Nice to meet you!",
  "redesign.convo.vehicle.named": "Nice to meet you, {name}!",
  "redesign.convo.odometer": "Great. Let's get it set up.",
  "redesign.convo.odometer.car": "A {car}. Good choice.",
  "redesign.convo.notify": "I'll give you a nudge before anything is due.",
  "redesign.convo.drive": "Thanks! Now a little about how you drive.",
  "redesign.convo.service": "Got it. That sets the pace of your plan.",
  "redesign.convo.cost": "This one surprised me too.",
  "redesign.convo.tracking": "You're more than halfway there.",
  "redesign.convo.worry": "Be honest, I won't judge.",
  "redesign.convo.source": "Last one, promise.",
  "redesign.convo.analyzing": "Give me a second to put this together.",
  "redesign.convo.compare": "Catching things early costs a lot less.",
  "redesign.convo.reviews": "Drivers like you keep me busy.",
  "redesign.convo.paywall": "I'm ready to look after your car.",
  "redesign.convo.paywall.named": "{name}, I'm ready to look after your car.",
  "redesign.convo.paywall.car": "I'm ready to look after your {car}.",
  "redesign.convo.paywall.both": "{name}, I'm ready to look after your {car}.",
  "redesign.convo.offer": "Wait! Here's a better deal before you go.",
  "redesign.back": "Back",
};
