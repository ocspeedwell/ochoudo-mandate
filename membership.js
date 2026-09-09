document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("membershipForm");

    form.addEventListener("submit", function (event) {

        event.preventDefault();

        alert(
            "Thank you for registering with the Ochoudo Mandate Group. Your membership registration has been received."
        );

    });

});/* ==========================================
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

        const response = await fetch("data/imo.json");

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

    if (
        !imoElectoralData ||
        !imoElectoralData.state ||
        !imoElectoralData.state.lgas
    ) {

        return;

    }


    lgaSelect.innerHTML = "";

    const defaultOption =
        document.createElement("option");

    defaultOption.value = "";

    defaultOption.textContent =
        "Select Local Government Area";

    lgaSelect.appendChild(defaultOption);


    imoElectoralData.state.lgas.forEach(
        function (lga) {

            const option =
                document.createElement("option");

            option.value = lga.id;

            option.textContent = formatName(lga.name);

            lgaSelect.appendChild(option);

        }
    );

}


/* ==========================================
   LGA CHANGE
========================================== */

lgaSelect.addEventListener(
    "change",
    function () {

        const selectedLGAId = this.value;


        /* Reset Ward */

        wardSelect.innerHTML = "";

        const wardDefault =
            document.createElement("option");

        wardDefault.value = "";

        wardDefault.textContent =
            "Select Ward";

        wardSelect.appendChild(wardDefault);

        wardSelect.disabled = true;


        /* Reset Polling Unit */

        pollingUnitSelect.innerHTML = "";

        const pollingDefault =
            document.createElement("option");

        pollingDefault.value = "";

        pollingDefault.textContent =
            "Select Polling Unit";

        pollingUnitSelect.appendChild(
            pollingDefault
        );

        pollingUnitSelect.disabled = true;


        if (!selectedLGAId) {

            return;

        }


        const selectedLGA =
            imoElectoralData.state.lgas.find(
                function (lga) {

                    return lga.id === selectedLGAId;

                }
            );


        if (
            !selectedLGA ||
            !selectedLGA.wards
        ) {

            return;

        }


        selectedLGA.wards.forEach(
            function (ward) {

                const option =
                    document.createElement("option");

                option.value = ward.id;

                option.textContent =
                    formatName(ward.name);

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

        const selectedLGAId =
            lgaSelect.value;

        const selectedWardId =
            this.value;


        /* Reset Polling Units */

        pollingUnitSelect.innerHTML = "";

        const pollingDefault =
            document.createElement("option");

        pollingDefault.value = "";

        pollingDefault.textContent =
            "Select Polling Unit";

        pollingUnitSelect.appendChild(
            pollingDefault
        );

        pollingUnitSelect.disabled = true;


        if (
            !selectedLGAId ||
            !selectedWardId
        ) {

            return;

        }


        const selectedLGA =
            imoElectoralData.state.lgas.find(
                function (lga) {

                    return lga.id === selectedLGAId;

                }
            );


        if (!selectedLGA) {

            return;

        }


        const selectedWard =
            selectedLGA.wards.find(
                function (ward) {

                    return ward.id === selectedWardId;

                }
            );


        if (
            !selectedWard ||
            !selectedWard.pollingUnits
        ) {

            return;

        }


        selectedWard.pollingUnits.forEach(
            function (pollingUnit) {

                const option =
                    document.createElement("option");

                /*
                 Store official INEC delimitation code
                */

                option.value =
                    pollingUnit.delimitation;


                /*
                 Display polling unit name
                */

                option.textContent =
                    formatName(pollingUnit.name);


                pollingUnitSelect.appendChild(option);

            }
        );


        pollingUnitSelect.disabled = false;

    }
);


/* ==========================================
   FORMAT NAMES
========================================== */

function formatName(name) {

    if (!name) return "";

    return name
        .toLowerCase()
        .replace(
            /\b\w/g,
            function (letter) {

                return letter.toUpperCase();

            }
        );

}


/* ==========================================
   INITIALISE
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadImoElectoralData();

    }
);
