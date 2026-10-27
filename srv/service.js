const cds = require('@sap/cds')

module.exports = class EventService extends cds.ApplicationService {

    async init() {

        const { Events, Participants, Registrations } =
            cds.entities('EventService')

        this.before(['CREATE', 'UPDATE'], Events, async (req) => {

            if (req.data.capacity !== undefined &&
                req.data.capacity <= 0) {
                req.error(
                    400,
                    'Event capacity must be greater than 0'
                )
            }

            if (req.data.title !== undefined &&
                !req.data.title.trim()) {
                req.error(
                    400,
                    'Event title cannot be empty'
                )
            }
        })

        this.before(['CREATE', 'UPDATE'], Participants, async (req) => {

            if (req.data.name !== undefined &&
                !req.data.name.trim()) {
                req.error(
                    400,
                    'Participant name cannot be empty'
                )
            }

            if (req.data.email !== undefined &&
                !req.data.email.includes('@')) {
                req.error(
                    400,
                    'Please enter a valid email address'
                )
            }
        })

        this.on('registerParticipant', async (req) => {

            const { eventID, participantID } = req.data
            const tx = cds.tx(req)

            const event = await tx.run(
                SELECT.one
                    .from(Events)
                    .where({ ID: eventID })
            )

            if (!event) {
                return req.error(404, 'Event not found')
            }

            const participant = await tx.run(
                SELECT.one
                    .from(Participants)
                    .where({ ID: participantID })
            )

            if (!participant) {
                return req.error(404, 'Participant not found')
            }

            if (event.status !== 'Open') {
                return req.error(
                    400,
                    'Registration is closed for this event'
                )
            }

            const registrations = await tx.run(
                SELECT
                    .from(Registrations)
                    .where({
                        event_ID: eventID,
                        status: 'Confirmed'
                    })
            )

            if (registrations.length >= event.capacity) {

                await tx.run(
                    UPDATE(Events)
                        .set({ status: 'Full' })
                        .where({ ID: eventID })
                )

                return req.error(
                    400,
                    'Event is already full'
                )
            }

            const existingRegistration = await tx.run(
                SELECT.one
                    .from(Registrations)
                    .where({
                        event_ID: eventID,
                        participant_ID: participantID,
                        status: 'Confirmed'
                    })
            )

            if (existingRegistration) {
                return req.error(
                    400,
                    'Participant is already registered'
                )
            }

            await tx.run(
                INSERT.into(Registrations).entries({
                    event_ID: eventID,
                    participant_ID: participantID,
                    registrationDate: new Date(),
                    status: 'Confirmed'
                })
            )

            const confirmedCount = registrations.length + 1

            if (confirmedCount >= event.capacity) {
                await tx.run(
                    UPDATE(Events)
                        .set({ status: 'Full' })
                        .where({ ID: eventID })
                )
            }

            return `Participant ${participant.name} registered successfully`
        })

        this.on('cancelRegistration', async (req) => {

            const { registrationID } = req.data
            const tx = cds.tx(req)

            const registration = await tx.run(
                SELECT.one
                    .from(Registrations)
                    .where({ ID: registrationID })
            )

            if (!registration) {
                return req.error(
                    404,
                    'Registration not found'
                )
            }

            if (registration.status === 'Cancelled') {
                return req.error(
                    400,
                    'Registration is already cancelled'
                )
            }

            await tx.run(
                UPDATE(Registrations)
                    .set({ status: 'Cancelled' })
                    .where({ ID: registrationID })
            )

            const event = await tx.run(
                SELECT.one
                    .from(Events)
                    .where({ ID: registration.event_ID })
            )

            if (event && event.status === 'Full') {

                const confirmedRegistrations = await tx.run(
                    SELECT
                        .from(Registrations)
                        .where({
                            event_ID: registration.event_ID,
                            status: 'Confirmed'
                        })
                )

                if (confirmedRegistrations.length < event.capacity) {
                    await tx.run(
                        UPDATE(Events)
                            .set({ status: 'Open' })
                            .where({
                                ID: registration.event_ID
                            })
                    )
                }
            }

            return 'Registration cancelled successfully'
        })

        this.on('closeEvent', async (req) => {

            const { eventID } = req.data
            const tx = cds.tx(req)

            const event = await tx.run(
                SELECT.one
                    .from(Events)
                    .where({ ID: eventID })
            )

            if (!event) {
                return req.error(404, 'Event not found')
            }

            if (event.status === 'Closed') {
                return req.error(
                    400,
                    'Event is already closed'
                )
            }

            await tx.run(
                UPDATE(Events)
                    .set({ status: 'Closed' })
                    .where({ ID: eventID })
            )

            return 'Event closed successfully'
        })

        this.on('reopenEvent', async (req) => {

            const { eventID } = req.data
            const tx = cds.tx(req)

            const event = await tx.run(
                SELECT.one
                    .from(Events)
                    .where({ ID: eventID })
            )

            if (!event) {
                return req.error(404, 'Event not found')
            }

            if (event.status === 'Open') {
                return req.error(
                    400,
                    'Event is already open'
                )
            }

            const confirmedRegistrations = await tx.run(
                SELECT
                    .from(Registrations)
                    .where({
                        event_ID: eventID,
                        status: 'Confirmed'
                    })
            )

            if (confirmedRegistrations.length >= event.capacity) {

                await tx.run(
                    UPDATE(Events)
                        .set({ status: 'Full' })
                        .where({ ID: eventID })
                )

                return req.error(
                    400,
                    'Event is full and cannot be reopened'
                )
            }

            await tx.run(
                UPDATE(Events)
                    .set({ status: 'Open' })
                    .where({ ID: eventID })
            )

            return 'Event reopened successfully'
        })

        return super.init()
    }
}