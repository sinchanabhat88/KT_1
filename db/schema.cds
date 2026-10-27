namespace event.management;

entity Events {
    key ID          : Integer;
        title       : String(100);
        description : String(255);
        date        : Date;
        location    : String(100);
        capacity    : Integer;
        status      : String(20);
        // Status values: Open, Full, Closed
}

entity Participants {
    key ID         : Integer;
        name       : String(100);
        email       : String(100);
        department : String(100);
}

entity Registrations {
    key ID               : Integer;
        event            : Association to Events;
        participant      : Association to Participants;
        registrationDate : Date;
        status            : String(20);
        // Status values: Confirmed, Cancelled
}