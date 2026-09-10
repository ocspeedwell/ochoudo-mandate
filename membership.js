/* =========================================================
   OCHOUDO MANDATE GROUP
   MEMBERSHIP REGISTRATION SYSTEM
   ========================================================= */

const SUPABASE_URL = "https://yopqftofkvwrpyyluffw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_k3whUGyuDbdQU6GA6egeuQ_k-g-nFoL";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


/* =========================================================
   ELEMENTS
   ========================================================= */

const form = document.getElementById("membershipForm");

const lgaSelect = document.getElementById("lga");
const wardSelect = document.getElementById("ward");
const pollingUnitSelect = document.getElementById("polling_unit");

const registrationDate = document.getElementById("registration_date");
const declaration = document.getElementById("declaration");
const submitButton = document.querySelector(".submit-membership");


/* =========================================================
   IMO ELECTORAL DATA
   ========================================================= */

let imoElectoralData = null;


/* =========================================================
   LOAD IMO ELECTORAL DATA
   ========================================================= */

async function loadImoElectoralData() {

    try {

        const response = await fetch("data/imo.json");

        if (!response.ok) {
            throw new Error("Unable to load Imo electoral data.");
        }

        imoElectoralData = await response.json();

        populateLGAs();

    } catch (error) {

        console.error("Electoral data error:", error);

        lgaSelect.innerHTML = `
            <option value="">Unable to load LGA data</option>
        `;

        lgaSelect.disabled = true;
    }
}


/* =========================================================
   POPULATE LGA
   ========================================================= */

function populateLGAs() {

    if (
        !imoElectoralData ||
        !imoElectoralData.state ||
        !imoElectoralData.state.lgas
    ) {
        return;
    }

    lgaSelect.innerHTML = "";

    const defaultOption = document.createElement("option");

    defaultOption.value = "";
    defaultOption.textContent = "Select LGA";

    lgaSelect.appendChild(defaultOption);

    imoElectoralData.state.lgas.forEach(function (lga) {

        const option = document.createElement("option");

        option.value = lga.id;
        option.textContent = formatName(lga.name);

        lgaSelect.appendChild(option);
    });

    lgaSelect.disabled = false;
}


/* =========================================================
   LGA CHANGE
   ========================================================= */

lgaSelect.addEventListener("change", function () {

    const selectedLGAId = this.value;

    resetWard();
    resetPollingUnit();

    if (!selectedLGAId) {
        return;
    }

    const selectedLGA =
        imoElectoralData.state.lgas.find(function (lga) {
            return lga.id === selectedLGAId;
        });

    if (!selectedLGA || !selectedLGA.wards) {
        return;
    }

    selectedLGA.wards.forEach(function (ward) {

        const option = document.createElement("option");

        option.value = ward.id;
        option.textContent = formatName(ward.name);

        wardSelect.appendChild(option);
    });

    wardSelect.disabled = false;
});


/* =========================================================
   WARD CHANGE
   ========================================================= */

wardSelect.addEventListener("change", function () {

    const selectedLGAId = lgaSelect.value;
    const selectedWardId = this.value;

    resetPollingUnit();

    if (!selectedLGAId || !selectedWardId) {
        return;
    }

    const selectedLGA =
        imoElectoralData.state.lgas.find(function (lga) {
            return lga.id === selectedLGAId;
        });

    if (!selectedLGA) {
        return;
    }

    const selectedWard =
        selectedLGA.wards.find(function (ward) {
            return ward.id === selectedWardId;
        });

    if (!selectedWard || !selectedWard.pollingUnits) {
        return;
    }

    selectedWard.pollingUnits.forEach(function (pollingUnit) {

        const option = document.createElement("option");

        /*
           Store the official delimitation code as the value.
           The visible text remains the polling unit name.
        */

        option.value = pollingUnit.delimitation;
        option.textContent = formatName(pollingUnit.name);

        pollingUnitSelect.appendChild(option);
    });

    pollingUnitSelect.disabled = false;
});


/* =========================================================
   RESET WARD
   ========================================================= */

function resetWard() {

    wardSelect.innerHTML = "";

    const option = document.createElement("option");

    option.value = "";
    option.textContent = "Select Ward";

    wardSelect.appendChild(option);

    wardSelect.disabled = true;
}


/* =========================================================
   RESET POLLING UNIT
   ========================================================= */

function resetPollingUnit() {

    pollingUnitSelect.innerHTML = "";

    const option = document.createElement("option");

    option.value = "";
    option.textContent = "Select Polling Unit";

    pollingUnitSelect.appendChild(option);

    pollingUnitSelect.disabled = true;
}


/* =========================================================
   FORMAT NAMES
   ========================================================= */

function formatName(name) {

    if (!name) {
        return "";
    }

    return name
        .toLowerCase()
        .replace(/\b\w/g, function (letter) {
            return letter.toUpperCase();
        });
}


/* =========================================================
   GET SELECTED ELECTORAL LOCATION
   ========================================================= */

function getSelectedElectoralLocation() {

    const lgaId = lgaSelect.value;
    const wardId = wardSelect.value;
    const pollingUnitCode = pollingUnitSelect.value;

    const lga =
        imoElectoralData.state.lgas.find(function (item) {
            return item.id === lgaId;
        });

    const ward =
        lga &&
        lga.wards.find(function (item) {
            return item.id === wardId;
        });

    const pollingUnit =
        ward &&
        ward.pollingUnits.find(function (item) {
            return item.delimitation === pollingUnitCode;
        });

    return {
        lgaName: lga ? formatName(lga.name) : "",
        wardName: ward ? formatName(ward.name) : "",
        pollingUnitName: pollingUnit
            ? formatName(pollingUnit.name)
            : "",
        pollingUnitCode: pollingUnit
            ? pollingUnit.delimitation
            : ""
    };
}


/* =========================================================
   PASSPORT PHOTO UPLOAD
   ========================================================= */

async function uploadPassportPhoto(file) {

    if (!file) {
        return null;
    }

    /* Maximum 2 MB */

    if (file.size > 2 * 1024 * 1024) {

        throw new Error(
            "Passport photo must not be larger than 2 MB."
        );
    }


    /* Allowed image types */

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {

        throw new Error(
            "Passport photo must be JPG, PNG or WebP."
        );
    }


    /*
       Generate a unique filename.

       The membership ID is not available until the
       database insert is completed, so we use a temporary
       unique filename.
    */

    const extension =
        file.name.split(".").pop().toLowerCase();

    const fileName =
        `${crypto.randomUUID()}.${extension}`;

    const filePath =
        `members/${fileName}`;


    const { error } =
        await db.storage
            .from("member-photos")
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
                contentType: file.type
            });


    if (error) {
        throw error;
    }

    return filePath;
}


/* =========================================================
   FORM SUBMISSION
   ========================================================= */

form.addEventListener("submit", async function (event) {

    event.preventDefault();


    /* Prevent double submission */

    if (submitButton.disabled) {
        return;
    }


    /* Browser validation */

    if (!form.checkValidity()) {

        form.reportValidity();

        return;
    }


    submitButton.disabled = true;

    const originalButtonText =
        submitButton.textContent;

    submitButton.textContent =
        "Submitting Registration...";


    try {

        /* =================================================
           FORM VALUES
           ================================================= */

        const fullName =
            document.getElementById("fullname").value.trim();

        const dateOfBirth =
            document.getElementById("dob").value || null;

        const gender =
            document.getElementById("gender").value || null;

        const phone =
            document.getElementById("phone").value.trim();

        const email =
            document.getElementById("email").value.trim() || null;


        /* NDC */

        const ndcSelection =
            document.querySelector(
                'input[name="ndc_member"]:checked'
            );

        const ndcMember =
            ndcSelection &&
            ndcSelection.value === "Yes";


        const ndcCardNumber =
            document
                .getElementById("party_card")
                .value
                .trim() || null;


        /* IMO LOCATION */

        const location =
            getSelectedElectoralLocation();


        /* RESIDENCE */

        const country =
            document.getElementById("country")
                .value
                .trim();

        const residenceState =
            document.getElementById("residence_state")
                .value
                .trim() || null;

        const city =
            document.getElementById("city")
                .value
                .trim();


        /* SKILLS */

        const occupation =
            document.getElementById("occupation")
                .value
                .trim() || null;

        const professionalSkills =
            document
                .getElementById("professional_skills")
                .value
                .trim() || null;


        /* INTERESTS */

        const interests =
            Array.from(
                document.querySelectorAll(
                    'input[name="interest"]:checked'
                )
            ).map(function (checkbox) {
                return checkbox.value;
            });


        /* REASON */

        const reasonForJoining =
            document
                .getElementById("reason")
                .value
                .trim() || null;


        /* DECLARATION */

        const declarationName =
            document
                .getElementById("declaration_name")
                .value
                .trim();

        const registrationDateValue =
            registrationDate.value;


        /* =================================================
           PASSPORT PHOTO
           ================================================= */

        const photoInput =
            document.getElementById("photo");

        const photoFile =
            photoInput && photoInput.files.length > 0
                ? photoInput.files[0]
                : null;


        let passportPath = null;


        if (photoFile) {

            submitButton.textContent =
                "Uploading Passport Photo...";

            passportPath =
                await uploadPassportPhoto(photoFile);
        }


        /* =================================================
           SAVE MEMBER
           ================================================= */

        submitButton.textContent =
            "Saving Membership...";


        const memberRecord = {

            full_name: fullName,

            date_of_birth: dateOfBirth,

            gender: gender,

            phone: phone,

            email: email,

            ndc_member: ndcMember,

            ndc_card_number: ndcCardNumber,

            state: "Imo",

            lga: location.lgaName,

            ward: location.wardName,

            polling_unit: location.pollingUnitName,

            polling_unit_code:
                location.pollingUnitCode,

            residence_country: country,

            residence_state: residenceState,

            residence_city: city,

            occupation: occupation,

            professional_skills: professionalSkills,

            interests: interests,

            reason_for_joining: reasonForJoining,

            declaration_confirmed:
                declaration.checked,

            declaration_name:
                declarationName,

            registration_date:
                registrationDateValue,

            passport_url:
                passportPath,

            membership_status:
                "Pending"
        };


  const { data, error } =
    await db.rpc(
        "register_membership",
        {
            p_member: memberRecord
        }
    );


if (error) {
    throw error;
}

  /* =================================================
   SUCCESS
   ================================================= */

const memberId = data || "Your membership number";

alert(
    "REGISTRATION SUCCESSFUL!\n\n" +
    "Welcome to the Ochoudo Mandate Group.\n\n" +
    "Your Membership ID is:\n" +
    memberId +
    "\n\n" +
    "Please keep this number for your records."
);


/* Reset form */

form.reset();

        resetWard();
        resetPollingUnit();

        setRegistrationDate();


    } catch (error) {

        console.error(
            "Membership registration error:",
            error
        );


        let message =
            "We could not complete your registration.";

        if (error && error.message) {
            message +=
                "\n\n" + error.message;
        }


        alert(message);


    } finally {

        submitButton.disabled = false;

        submitButton.textContent =
            originalButtonText;
    }

});


/* =========================================================
   DEFAULT REGISTRATION DATE
   ========================================================= */

function setRegistrationDate() {

    if (!registrationDate) {
        return;
    }

    const today =
        new Date().toISOString().split("T")[0];

    registrationDate.value = today;
}


/* =========================================================
   INITIALISE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setRegistrationDate();

        loadImoElectoralData();

    }
);
