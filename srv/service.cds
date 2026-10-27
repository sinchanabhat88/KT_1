using event.management as em from '../db/schema.cds';

service EventService {

    entity Events as projection on em.Events;

    entity Participants as projection on em.Participants;

    entity Registrations as projection on em.Registrations;


    // Register a participant for an event
    action registerParticipant(
        eventID       : Integer,
        participantID : Integer
    ) returns String;


    // Cancel an existing registration
    action cancelRegistration(
        registrationID : Integer
    ) returns String;


    // Close an event manually
    action closeEvent(
        eventID : Integer
    ) returns String;


    // Reopen a closed event
    action reopenEvent(
        eventID : Integer
    ) returns String;

}