sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/DatePicker",
    "sap/m/Label",
    "sap/m/Button",
    "sap/m/VBox",
    "sap/ui/core/Item"
], (
    Controller,
    JSONModel,
    Filter,
    FilterOperator,
    MessageToast,
    Dialog,
    Input,
    DatePicker,
    Label,
    Button,
    VBox,
    Item
) => {
    "use strict";

    return Controller.extend("frontend.controller.main", {

        onInit: function () {

            this.getView().setModel(
                new JSONModel([]),
                "events"
            );

            this.getView().setModel(
                new JSONModel({
                    totalEvents: 0,
                    openEvents: 0,
                    totalRegistrations: 0,
                    availableSeats: 0
                }),
                "dashboard"
            );

            this._loadEventData();
        },

        _loadEventData: async function () {

            try {

                const oModel = this.getView().getModel();

                const oEventBinding =
                    oModel.bindList("/Events");

                const oRegistrationBinding =
                    oModel.bindList("/Registrations");

                const [
                    aEventContexts,
                    aRegistrationContexts
                ] = await Promise.all([
                    oEventBinding.requestContexts(0, 1000),
                    oRegistrationBinding.requestContexts(0, 1000)
                ]);

                const aEvents =
                    aEventContexts.map(
                        oContext => oContext.getObject()
                    );

                const aRegistrations =
                    aRegistrationContexts.map(
                        oContext => oContext.getObject()
                    );

                const aEventData = aEvents.map(oEvent => {

                    const iRegisteredCount =
                        aRegistrations.filter(
                            oRegistration =>
                                oRegistration.event_ID === oEvent.ID &&
                                oRegistration.status === "Confirmed"
                        ).length;

                    return {
                        ...oEvent,
                        registeredCount: iRegisteredCount,
                        availableSeats: Math.max(
                            oEvent.capacity - iRegisteredCount,
                            0
                        )
                    };
                });

                const iTotalEvents = aEvents.length;

                const iOpenEvents =
                    aEvents.filter(
                        oEvent => oEvent.status === "Open"
                    ).length;

                const iTotalRegistrations =
                    aRegistrations.length;

                const iAvailableSeats =
                    aEventData.reduce(
                        (iTotal, oEvent) =>
                            iTotal + oEvent.availableSeats,
                        0
                    );

                this.getView()
                    .getModel("events")
                    .setData(aEventData);

                this.getView()
                    .getModel("dashboard")
                    .setData({
                        totalEvents: iTotalEvents,
                        openEvents: iOpenEvents,
                        totalRegistrations: iTotalRegistrations,
                        availableSeats: iAvailableSeats
                    });

                this._loadLocations(aEvents);

            } catch (oError) {

                MessageToast.show(
                    "Failed to load event data: " +
                    oError.message
                );
            }
        },

        _loadLocations: function (aEvents) {

            const oSelect =
                this.byId("locationFilter");

            oSelect.destroyItems();

            oSelect.addItem(
                new Item({
                    key: "",
                    text: "All Locations"
                })
            );

            const aLocations = [
                ...new Set(
                    aEvents
                        .map(oEvent => oEvent.location)
                        .filter(Boolean)
                )
            ].sort();

            aLocations.forEach(sLocation => {

                oSelect.addItem(
                    new Item({
                        key: sLocation,
                        text: sLocation
                    })
                );
            });

            oSelect.setSelectedKey("");
        },

        onViewRegistrations: function () {

            this.getOwnerComponent()
                .getRouter()
                .navTo("RouteRegistrations");
        },

        onFilterEvents: function () {

            const oList =
                this.byId("eventList");

            const oBinding =
                oList.getBinding("items");

            if (!oBinding) {
                return;
            }

            const sSearch =
                this.byId("eventSearchInput")
                    .getValue()
                    .trim();

            const sLocation =
                this.byId("locationFilter")
                    .getSelectedKey();

            const sStatus =
                this.byId("statusFilter")
                    .getSelectedKey();

            const aFilters = [];

            if (sSearch) {

                aFilters.push(
                    new Filter({
                        filters: [
                            new Filter(
                                "title",
                                FilterOperator.Contains,
                                sSearch
                            ),
                            new Filter(
                                "description",
                                FilterOperator.Contains,
                                sSearch
                            ),
                            new Filter(
                                "location",
                                FilterOperator.Contains,
                                sSearch
                            )
                        ],
                        and: false
                    })
                );
            }

            if (sLocation) {

                aFilters.push(
                    new Filter(
                        "location",
                        FilterOperator.EQ,
                        sLocation
                    )
                );
            }

            if (sStatus) {

                aFilters.push(
                    new Filter(
                        "status",
                        FilterOperator.EQ,
                        sStatus
                    )
                );
            }

            oBinding.filter(aFilters);
        },

        onCreateEvent: function () {

            const oTitleInput = new Input({
                id: this.createId("eventTitleInput"),
                placeholder: "Enter event title"
            });

            const oDescriptionInput = new Input({
                id: this.createId("eventDescriptionInput"),
                placeholder: "Enter description"
            });

            const oDatePicker = new DatePicker({
                id: this.createId("eventDateInput"),
                placeholder: "Select date",
                valueFormat: "yyyy-MM-dd",
                displayFormat: "MMM dd, yyyy"
            });

            const oLocationInput = new Input({
                id: this.createId("eventLocationInput"),
                placeholder: "Enter location"
            });

            const oCapacityInput = new Input({
                id: this.createId("eventCapacityInput"),
                placeholder: "Enter capacity",
                type: "Number"
            });

            const oDialogContent = new VBox({
                id: this.createId("createEventVBox"),
                class: "sapUiMediumMargin",
                items: [
                    new Label({
                        id: this.createId("titleLabel"),
                        text: "Title"
                    }),
                    oTitleInput,

                    new Label({
                        id: this.createId("descriptionLabel"),
                        text: "Description"
                    }),
                    oDescriptionInput,

                    new Label({
                        id: this.createId("dateLabel"),
                        text: "Date"
                    }),
                    oDatePicker,

                    new Label({
                        id: this.createId("locationLabel"),
                        text: "Location"
                    }),
                    oLocationInput,

                    new Label({
                        id: this.createId("capacityLabel"),
                        text: "Capacity"
                    }),
                    oCapacityInput
                ]
            });

            const oDialog = new Dialog({
                id: this.createId("createEventDialog"),
                title: "Create Event",
                contentWidth: "400px",
                content: [oDialogContent],

                beginButton: new Button({
                    id: this.createId("saveEventButton"),
                    text: "Create",
                    type: "Emphasized",

                    press: async () => {

                        const sTitle =
                            oTitleInput
                                .getValue()
                                .trim();

                        const sDescription =
                            oDescriptionInput
                                .getValue()
                                .trim();

                        const sDate =
                            oDatePicker.getValue();

                        const sLocation =
                            oLocationInput
                                .getValue()
                                .trim();

                        const iCapacity =
                            parseInt(
                                oCapacityInput.getValue(),
                                10
                            );

                        if (
                            !sTitle ||
                            !sDate ||
                            !sLocation ||
                            !iCapacity ||
                            iCapacity <= 0
                        ) {
                            MessageToast.show(
                                "Please enter all required event details"
                            );
                            return;
                        }

                        const oModel =
                            this.getView().getModel();

                        const oListBinding =
                            oModel.bindList("/Events");

                        try {

                            const oContext =
                                oListBinding.create({
                                    title: sTitle,
                                    description: sDescription,
                                    date: sDate,
                                    location: sLocation,
                                    capacity: iCapacity,
                                    status: "Open"
                                });

                            await oContext.created();

                            MessageToast.show(
                                "Event created successfully"
                            );

                            oDialog.close();

                            await this._loadEventData();

                        } catch (oError) {

                            MessageToast.show(
                                "Failed to create event: " +
                                oError.message
                            );
                        }
                    }
                }),

                endButton: new Button({
                    id: this.createId("cancelEventButton"),
                    text: "Cancel",

                    press: () => {
                        oDialog.close();
                    }
                }),

                afterClose: () => {
                    oDialog.destroy();
                }
            });

            this.getView()
                .addDependent(oDialog);

            oDialog.open();
        },

        onRegisterParticipant: function (oEvent) {

            const oButton =
                oEvent.getSource();

            const oContext =
                oButton.getBindingContext("events");

            if (!oContext) {
                MessageToast.show(
                    "Unable to identify the selected event"
                );
                return;
            }

            const oEventData =
                oContext.getObject();

            const oParticipantInput = new Input({
                id: this.createId("participantIdInput"),
                placeholder: "Enter Participant ID",
                type: "Number"
            });

            const oDialogContent = new VBox({
                id: this.createId("registerParticipantVBox"),
                class: "sapUiMediumMargin",
                items: [
                    new Label({
                        id: this.createId("participantIdLabel"),
                        text: "Participant ID"
                    }),
                    oParticipantInput
                ]
            });

            const oDialog = new Dialog({
                id: this.createId("registerParticipantDialog"),
                title: "Register Participant",
                contentWidth: "350px",
                content: [oDialogContent],

                beginButton: new Button({
                    id: this.createId("confirmRegistrationButton"),
                    text: "Register",
                    type: "Emphasized",

                    press: async () => {

                        const iParticipantID =
                            parseInt(
                                oParticipantInput.getValue(),
                                10
                            );

                        if (
                            !iParticipantID ||
                            iParticipantID <= 0
                        ) {
                            MessageToast.show(
                                "Please enter a valid Participant ID"
                            );
                            return;
                        }

                        const oModel =
                            this.getView().getModel();

                        try {

                            const oAction =
                                oModel.bindContext(
                                    "/registerParticipant(...)"
                                );

                            oAction.setParameter(
                                "eventID",
                                oEventData.ID
                            );

                            oAction.setParameter(
                                "participantID",
                                iParticipantID
                            );

                            await oAction.execute();

                            MessageToast.show(
                                "Participant registered successfully"
                            );

                            oDialog.close();

                            await this._loadEventData();

                        } catch (oError) {

                            MessageToast.show(
                                "Registration failed: " +
                                oError.message
                            );
                        }
                    }
                }),

                endButton: new Button({
                    id: this.createId("cancelRegistrationButton"),
                    text: "Cancel",

                    press: () => {
                        oDialog.close();
                    }
                }),

                afterClose: () => {
                    oDialog.destroy();
                }
            });

            this.getView()
                .addDependent(oDialog);

            oDialog.open();
        },

        onCloseEvent: async function (oEvent) {

            const oContext =
                oEvent.getSource()
                    .getBindingContext("events");

            if (!oContext) {
                MessageToast.show(
                    "Unable to identify the selected event"
                );
                return;
            }

            const oEventData =
                oContext.getObject();

            try {

                const oModel =
                    this.getView().getModel();

                const oAction =
                    oModel.bindContext(
                        "/closeEvent(...)"
                    );

                oAction.setParameter(
                    "eventID",
                    oEventData.ID
                );

                await oAction.execute();

                MessageToast.show(
                    "Event closed successfully"
                );

                await this._loadEventData();

            } catch (oError) {

                MessageToast.show(
                    "Failed to close event: " +
                    oError.message
                );
            }
        },

        onReopenEvent: async function (oEvent) {

            const oContext =
                oEvent.getSource()
                    .getBindingContext("events");

            if (!oContext) {
                MessageToast.show(
                    "Unable to identify the selected event"
                );
                return;
            }

            const oEventData =
                oContext.getObject();

            try {

                const oModel =
                    this.getView().getModel();

                const oAction =
                    oModel.bindContext(
                        "/reopenEvent(...)"
                    );

                oAction.setParameter(
                    "eventID",
                    oEventData.ID
                );

                await oAction.execute();

                MessageToast.show(
                    "Event reopened successfully"
                );

                await this._loadEventData();

            } catch (oError) {

                MessageToast.show(
                    "Failed to reopen event: " +
                    oError.message
                );
            }
        }

    });
});