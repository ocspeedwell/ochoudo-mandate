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
   IMO ELECTORAL LOCATION SYSTEM
========================================== */

let imoElectoralData = null;

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

            throw new Error(
                "Unable to load Imo electoral data"
            );

        }


        imoElectoralData = await response.json();


        populateLGAs();


    } catch (error) {

        console.error(
            "Error loading Imo electoral data:",
            error
        );

    }

}


/* ==========================================
   POPULATE LGAs
========================================== */

function populateLGAs() {

    if (!imoElectoralData) return;


    lgaSelect.innerHTML = `
        <option value="">
            Select LGA
        </option>
    `;


    imoElectoralData.lgas.forEach(function (lga) {

        const option = document.createElement("option");

        option.value = lga.name;

        option.textContent = lga.name;

        lgaSelect.appendChild(option);

    });


}


/* ==========================================
   LGA CHANGE
========================================== */

lgaSelect.addEventListener(
    "change",
    function () {

        const selectedLGA = this.value;


        /* Reset Ward */

        wardSelect.innerHTML = `
            <option value="">
                Select Ward
            </option>
        `;


        wardSelect.disabled = true;


        /* Reset Polling Unit */

        pollingUnitSelect.innerHTML = `
            <option value="">
                Select Polling Unit
            </option>
        `;


        pollingUnitSelect.disabled = true;


        if (!selectedLGA) return;


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

            return;

        }


        lgaData.wards.forEach(function (ward) {

            const option = document.createElement("option");

            option.value = ward.name;

            option.textContent = ward.name;

            wardSelect.appendChild(option);

        });


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


        pollingUnitSelect.disabled = true;


        if (
            !selectedLGA ||
            !selectedWard
        ) return;


        const lgaData = imoElectoralData.lgas.find(
            function (lga) {

                return lga.name === selectedLGA;

            }
        );


        if (!lgaData) return;


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

            return;

        }


        wardData.polling_units.forEach(
            function (pollingUnit) {

                const option =
                    document.createElement("option");


                option.value = pollingUnit;

                option.textContent = pollingUnit;

                pollingUnitSelect.appendChild(option);

            }
        );


        pollingUnitSelect.disabled = false;

    }
);


/* ==========================================
   INITIALISE
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadImoElectoralData();

    }
);
