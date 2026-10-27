sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
], (
    Controller,
    JSONModel,
    Filter,
    FilterOperator,
    MessageToast
) => {
    "use strict";

    return Controller.extend("frontend.controller.Registrations", {

        onInit: function () {

            this.getView().setModel(
                new JSONModel({
                    total: 0,
                    confirmed: 0,
                    cancelled: 0
                }),
                "registrationSummary"
            );

            this._loadRegistrationSummary();
        },

        onBack: function () {

            this.getOwnerComponent()
                .getRouter()
                .navTo("Routemain");
        },

        _loadRegistrationSummary: async function () {

            try {

                const oModel =
                    this.getView().getModel();

                const oBinding =
                    oModel.bindList("/Registrations");

                const aContexts =
                    await oBinding.requestContexts(0, 1000);

                const aRegistrations =
                    aContexts.map(
                        oContext => oContext.getObject()
                    );

                const iTotal =
                    aRegistrations.length;

                const iConfirmed =
                    aRegistrations.filter(
                        oRegistration =>
                            oRegistration.status === "Confirmed"
                    ).length;

                const iCancelled =
                    aRegistrations.filter(
                        oRegistration =>
                            oRegistration.status === "Cancelled"
                    ).length;

                this.getView()
                    .getModel("registrationSummary")
                    .setData({
                        total: iTotal,
                        confirmed: iConfirmed,
                        cancelled: iCancelled
                    });

            } catch (oError) {

                MessageToast.show(
                    "Failed to load registration summary: " +
                    oError.message
                );
            }
        },

        onFilterRegistrations: function () {

            const oTable =
                this.byId("registrationsTable");

            const oBinding =
                oTable.getBinding("items");

            if (!oBinding) {
                return;
            }

            const sStatus =
                this.byId("registrationStatusFilter")
                    .getSelectedKey();

            if (!sStatus) {
                oBinding.filter([]);
                return;
            }

            oBinding.filter(
                new Filter(
                    "status",
                    FilterOperator.EQ,
                    sStatus
                )
            );
        },

        onCancelRegistration: async function (oEvent) {

            const oContext =
                oEvent.getSource()
                    .getBindingContext();

            if (!oContext) {

                MessageToast.show(
                    "Unable to identify registration"
                );

                return;
            }

            const oRegistration =
                oContext.getObject();

            if (oRegistration.status === "Cancelled") {

                MessageToast.show(
                    "Registration is already cancelled"
                );

                return;
            }

            try {

                const oModel =
                    this.getView().getModel();

                const oAction =
                    oModel.bindContext(
                        "/cancelRegistration(...)"
                    );

                oAction.setParameter(
                    "registrationID",
                    oRegistration.ID
                );

                await oAction.execute();

                MessageToast.show(
                    "Registration cancelled successfully"
                );

                const oTable =
                    this.byId("registrationsTable");

                const oBinding =
                    oTable.getBinding("items");

                if (oBinding) {
                    oBinding.refresh();
                }

                await this._loadRegistrationSummary();

                this.byId("registrationStatusFilter")
                    .setSelectedKey("");

            } catch (oError) {

                MessageToast.show(
                    "Cancellation failed: " +
                    oError.message
                );
            }
        }

    });
});