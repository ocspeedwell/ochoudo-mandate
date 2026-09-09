document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("membershipForm");

    form.addEventListener("submit", function (event) {

        event.preventDefault();

        alert(
            "Thank you for registering with the Ochoudo Mandate Group. Your membership registration has been received."
        );

    });

});
/* ==========================================
   IMO ELECTORAL LOCATION DATA
========================================== */

let imoElectoralData = null;

const politicalState = document.getElementById("political_state");
const lgaSelect = document.getElementById("lga");
const wardSelect = document.getElementById("ward");
const pollingUnitSelect = document.getElementById("polling_unit");


/* ==========================================
   LOAD IMO ELECTORAL DATA
========================================== */

async function loadImoElectoralData() {

    try {

        const response = await fetch(
            "data/imo-electoral-data.json"
        );

        if (!response.ok) {
            throw new Error("Unable to load electoral data");
        }

        imoElectoralData = await response.json();

        console.log(
            "Imo electoral data loaded successfully",
            imoElectoralData
        );

    } catch (error) {

        console.error(
            "Error loading electoral data:",
            error
        );

    }

}


/* ==========================================
   POPULATE LGA DROPDOWN
========================================== */

function populateLGAs() {

    lgaSelect.innerHTML = `
        <option value="">
            Select LGA
        </option>
    `;

    wardSelect.innerHTML = `
        <option value="">
            Select Ward
        </option>
    `;

    pollingUnitSelect.innerHTML = `
        <option value="">
            Select Polling Unit
        </option>
    `;


    wardSelect.disabled = true;
    pollingUnitSelect.disabled = true;


    if (!imoElectoralData) {

        return;

    }


    imoElectoralData.lgas.forEach(function (lga) {

        const option = document.createElement("option");

        option.value = lga.name;

        option.textContent = lga.name;

        lgaSelect.appendChild(option);

    });


    lgaSelect.disabled = false;

}


/* ==========================================
   STATE CHANGE
========================================== */

politicalState.addEventListener(
    "change",
    function () {

        if (this.value === "Imo") {

            populateLGAs();

        } else {

            lgaSelect.disabled = true;

            wardSelect.disabled = true;

            pollingUnitSelect.disabled = true;

        }

    }
);


/* ==========================================
   LGA CHANGE
========================================== */

lgaSelect.addEventListener(
    "change",
    function () {

        const selectedLGA = this.value;


        wardSelect.innerHTML = `
            <option value="">
                Select Ward
            </option>
        `;


        pollingUnitSelect.innerHTML = `
            <option value="">
                Select Polling Unit
            </option>
        `;


        pollingUnitSelect.disabled = true;


        if (!selectedLGA) {

            wardSelect.disabled = true;

            return;

        }


        const lgaData = imoElectoralData.lgas.find(
            function (lga) {

                return lga.name === selectedLGA;

            }
        );


        if (
            !lgaData ||
            !lgaData.wards ||
            lgaData.wards.length === 0
        ) {

            wardSelect.disabled = true;

            return;

        }


        lgaData.wards.forEach(
            function (ward) {

                const option = document.createElement("option");

                option.value = ward.name;

                option.textContent = ward.name;

                wardSelect.appendChild(option);

            }
        );


        wardSelect.disabled = false;

    }
);


/* ==========================================
   WARD CHANGE
========================================== */

wardSelect.addEventListener(
    "change",
    function () {

        const selectedLGA = lgaSelect.value;

        const selectedWard = this.value;


        pollingUnitSelect.innerHTML = `
            <option value="">
                Select Polling Unit
            </option>
        `;


        if (
            !selectedLGA ||
            !selectedWard
        ) {

            pollingUnitSelect.disabled = true;

            return;

        }


        const lgaData = imoElectoralData.lgas.find(
            function (lga) {

                return lga.name === selectedLGA;

            }
        );


        const wardData = lgaData.wards.find(
            function (ward) {

                return ward.name === selectedWard;

            }
        );


        if (
            !wardData ||
            !wardData.polling_units ||
            wardData.polling_units.length === 0
        ) {

            pollingUnitSelect.disabled = true;

            return;

        }


        wardData.polling_units.forEach(
            function (pollingUnit) {

                const option = document.createElement("option");

                option.value = pollingUnit;

                option.textContent = pollingUnit;

                pollingUnitSelect.appendChild(option);

            }
        );


        pollingUnitSelect.disabled = false;

    }
);


/* ==========================================
   INITIALISE DATA
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadImoElectoralData();

    }
);
