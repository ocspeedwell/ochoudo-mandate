/* =========================================================
   OCHOUDO MANDATE GROUP
   MEMBERSHIP REGISTRATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       SUPABASE
       ===================================================== */

    const SUPABASE_URL =
        "https://yopqftofkvwrpyyluffw.supabase.co";

    const SUPABASE_ANON_KEY =
        "sb_publishable_k3whUGyuDbdQU6GA6egeuQ_k-g-nFoL";

    const db = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


    /* =====================================================
       ELEMENTS
       ===================================================== */

    const form =
        document.getElementById("membershipForm");

    const preview =
        document.getElementById("registrationPreview");

    const success =
        document.getElementById("registrationSuccess");

    const previewButton =
        form.querySelector(".submit-membership");

    const editButton =
        document.getElementById("editRegistration");

    const confirmButton =
        document.getElementById("confirmRegistration");

    const printButton =
        document.getElementById("printConfirmation");

    const photoInput =
        document.getElementById("photo");


    /* =====================================================
       ELECTORAL LOCATION
       ===================================================== */

    let imoElectoralData = null;

    const lgaSelect =
        document.getElementById("lga");

    const wardSelect =
        document.getElementById("ward");

    const pollingUnitSelect =
        document.getElementById("polling_unit");


    async function loadImoElectoralData() {

        try {

            const response =
                await fetch("data/imo.json");

            if (!response.ok) {
                throw new Error(
                    "Unable to load Imo electoral data."
                );
            }

            imoElectoralData =
                await response.json();

            populateLGAs();

        } catch (error) {

            console.error(
                "Electoral data error:",
                error
            );

        }

    }


    function populateLGAs() {

        if (!imoElectoralData) return;

        lgaSelect.innerHTML =
            '<option value="">Select LGA</option>';

        imoElectoralData.state.lgas.forEach(
            function (lga) {

                const option =
                    document.createElement("option");

                option.value = lga.id;
                option.textContent = lga.name;

                lgaSelect.appendChild(option);

            }
        );

    }


    lgaSelect.addEventListener(
        "change",
        function () {

            wardSelect.innerHTML =
                '<option value="">Select Ward</option>';

            pollingUnitSelect.innerHTML =
                '<option value="">Select Polling Unit</option>';

            wardSelect.disabled = true;
            pollingUnitSelect.disabled = true;

            const selectedLga =
                imoElectoralData.state.lgas.find(
                    function (lga) {
                        return lga.id === lgaSelect.value;
                    }
                );

            if (!selectedLga) return;

            selectedLga.wards.forEach(
                function (ward) {

                    const option =
                        document.createElement("option");

                    option.value = ward.id;
                    option.textContent = ward.name;

                    wardSelect.appendChild(option);

                }
            );

            wardSelect.disabled = false;

        }
    );


    wardSelect.addEventListener(
        "change",
        function () {

            pollingUnitSelect.innerHTML =
                '<option value="">Select Polling Unit</option>';

            pollingUnitSelect.disabled = true;

            const selectedLga =
                imoElectoralData.state.lgas.find(
                    function (lga) {
                        return lga.id === lgaSelect.value;
                    }
                );

            if (!selectedLga) return;

            const selectedWard =
                selectedLga.wards.find(
                    function (ward) {
                        return ward.id === wardSelect.value;
                    }
                );

            if (!selectedWard) return;

            selectedWard.pollingUnits.forEach(
                function (unit) {

                    const option =
                        document.createElement("option");

                    option.value =
                        unit.name;

                    option.textContent =
                        unit.name;

                    option.dataset.delimitation =
                        unit.delimitation || "";

                    pollingUnitSelect.appendChild(
                        option
                    );

                }
            );

            pollingUnitSelect.disabled = false;

        }
    );


    function getSelectedElectoralLocation() {

        const selectedLga =
            imoElectoralData.state.lgas.find(
                function (lga) {
                    return lga.id === lgaSelect.value;
                }
            );

        const selectedWard =
            selectedLga &&
            selectedLga.wards.find(
                function (ward) {
                    return ward.id === wardSelect.value;
                }
            );

        const selectedPollingUnit =
            pollingUnitSelect.options[
                pollingUnitSelect.selectedIndex
            ];

        return {

            lga:
                selectedLga
                    ? selectedLga.name
                    : "",

            ward:
                selectedWard
                    ? selectedWard.name
                    : "",

            polling_unit:
                selectedPollingUnit
                    ? selectedPollingUnit.textContent
                    : "",

            polling_unit_code:
                selectedPollingUnit
                    ? (
                        selectedPollingUnit
                            .dataset.delimitation || ""
                    )
                    : ""

        };

    }


    /* =====================================================
       REGISTRATION DATE
       ===================================================== */

    const registrationDate =
        document.getElementById(
            "registration_date"
        );

    if (registrationDate && !registrationDate.value) {

        const today =
            new Date();

        const year =
            today.getFullYear();

        const month =
            String(
                today.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                today.getDate()
            ).padStart(2, "0");

        registrationDate.value =
            `${year}-${month}-${day}`;

    }


    /* =====================================================
       PASSPORT PHOTOGRAPH PREVIEW
       ===================================================== */

    let selectedPhotoURL = null;


    photoInput.addEventListener(
        "change",
        function () {

            const file =
                photoInput.files[0];

            if (!file) return;


            /* File type */

            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];

            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {

                photoInput.value = "";

                alert(
                    "Please select a JPG, JPEG, PNG or WebP image."
                );

                return;

            }


            /* File size */

            const maxSize =
                2 * 1024 * 1024;

            if (file.size > maxSize) {

                photoInput.value = "";

                alert(
                    "The passport photograph is too large. " +
                    "Maximum size is 2 MB."
                );

                return;

            }


            /* Revoke previous preview */

            if (selectedPhotoURL) {

                URL.revokeObjectURL(
                    selectedPhotoURL
                );

            }


            selectedPhotoURL =
                URL.createObjectURL(file);


            /* Existing upload area */

            const photoUpload =
                document.querySelector(
                    ".photo-upload"
                );

            if (!photoUpload) return;


            photoUpload.classList.add(
                "photo-selected"
            );


            photoUpload.innerHTML = `

                <div class="photo-preview-container">

                    <img
                        src="${selectedPhotoURL}"
                        alt="Selected passport photograph"
                        class="photo-preview-image">

                    <div class="photo-upload-success">

                        <strong>
                            ✓ Photograph Selected
                        </strong>

                        <span>
                            ${escapeHTML(file.name)}
                        </span>

                        <small>
                            ${(file.size / 1024).toFixed(0)} KB
                        </small>

                    </div>

                    <button
                        type="button"
                        class="change-photo-button"
                        id="changePhotoButton">
                        Change Photograph
                    </button>

                </div>

            `;


            const changeButton =
                document.getElementById(
                    "changePhotoButton"
                );

            changeButton.addEventListener(
                "click",
                function () {

                    photoInput.click();

                }
            );

        }
    );


    /* =====================================================
       PREVIEW FORM
       ===================================================== */

    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            /* Browser validation */

            if (!form.checkValidity()) {

                form.reportValidity();

                return;

            }


            populatePreview();


            form.hidden = true;

            preview.hidden = false;

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );


    function populatePreview() {

        setPreview(
            "previewFullname",
            getValue("fullname")
        );

        setPreview(
            "previewDob",
            formatDate(
                getValue("dob")
            )
        );

        setPreview(
            "previewGender",
            getValue("gender")
        );

        setPreview(
            "previewPhone",
            getValue("phone")
        );

        setPreview(
            "previewEmail",
            getValue("email"),
            "Not provided"
        );


        /* NDC */

        const ndc =
            document.querySelector(
                'input[name="ndc_member"]:checked'
            );

        setPreview(
            "previewNdcMember",
            ndc ? ndc.value : ""
        );

        setPreview(
            "previewPartyCard",
            getValue("party_card"),
            "Not provided"
        );


        /* Electoral location */

        const location =
            getSelectedElectoralLocation();

        setPreview(
            "previewLga",
            location.lga
        );

        setPreview(
            "previewWard",
            location.ward
        );

        setPreview(
            "previewPollingUnit",
            location.polling_unit
        );

        setPreview(
            "previewPollingCode",
            location.polling_unit_code
        );


        /* Residence */

        setPreview(
            "previewCountry",
            getValue("country")
        );

        setPreview(
            "previewResidenceState",
            getValue("residence_state")
        );

        setPreview(
            "previewCity",
            getValue("city")
        );


        /* Skills */

        setPreview(
            "previewOccupation",
            getValue("occupation")
        );

        setPreview(
            "previewSkills",
            getValue("professional_skills"),
            "Not provided"
        );


        const interests =
            Array.from(
                document.querySelectorAll(
                    'input[name="interest"]:checked'
                )
            )
            .map(
                function (input) {
                    return input.value;
                }
            );


        setPreview(
            "previewInterests",
            interests.length
                ? interests.join(", ")
                : "None selected"
        );


        setPreview(
            "previewReason",
            getValue("reason"),
            "Not provided"
        );


        /* Declaration */

        setPreview(
            "previewDeclarationName",
            getValue("declaration_name")
        );

        setPreview(
            "previewRegistrationDate",
            formatDate(
                getValue("registration_date")
            )
        );


        /* Passport */

        const previewPhoto =
            document.getElementById(
                "previewPhoto"
            );

        if (
            photoInput.files &&
            photoInput.files[0]
        ) {

            const file =
                photoInput.files[0];

            const photoURL =
                URL.createObjectURL(file);

            previewPhoto.innerHTML = `

                <img
                    src="${photoURL}"
                    alt="Passport photograph"
                    class="preview-passport-image">

                <span>
                    ✓ Photograph selected
                </span>

            `;

        } else {

            previewPhoto.innerHTML = `

                <div class="no-photo">
                    No photograph selected
                </div>

            `;

        }

    }


    /* =====================================================
       EDIT REGISTRATION
       ===================================================== */

    editButton.addEventListener(
        "click",
        function () {

            preview.hidden = true;

            form.hidden = false;

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );


    /* =====================================================
       CONFIRM & SUBMIT
       ===================================================== */

    confirmButton.addEventListener(
        "click",
        async function () {

            if (
                confirmButton.disabled
            ) {
                return;
            }


            confirmButton.disabled = true;

            confirmButton.textContent =
                "Submitting Registration...";


            try {

                /* =========================================
                   PASSPORT PHOTO
                   ========================================= */

                let passportPath = "";


                if (
                    photoInput.files &&
                    photoInput.files[0]
                ) {

                    const file =
                        photoInput.files[0];

                    const extension =
                        file.name
                            .split(".")
                            .pop()
                            .toLowerCase();

                    const fileName =
                        `${crypto.randomUUID()}.${extension}`;

                    passportPath =
                        `members/${fileName}`;


                    const {
                        error: uploadError
                    } =
                        await db.storage
                            .from("member-photos")
                            .upload(
                                passportPath,
                                file,
                                {
                                    cacheControl: "3600",
                                    upsert: false,
                                    contentType: file.type
                                }
                            );


                    if (uploadError) {

                        throw uploadError;

                    }

                }


                /* =========================================
                   ELECTORAL LOCATION
                   ========================================= */

                const location =
                    getSelectedElectoralLocation();


                /* =========================================
                   INTERESTS
                   ========================================= */

                const interests =
                    Array.from(
                        document.querySelectorAll(
                            'input[name="interest"]:checked'
                        )
                    )
                    .map(
                        function (input) {
                            return input.value;
                        }
                    );


                /* =========================================
                   NDC
                   ========================================= */

                const ndc =
                    document.querySelector(
                        'input[name="ndc_member"]:checked'
                    );


                /* =========================================
                   MEMBER RECORD
                   ========================================= */

                const memberRecord = {

                    full_name:
                        getValue("fullname"),

                    date_of_birth:
                        getValue("dob"),

                    gender:
                        getValue("gender"),

                    phone:
                        getValue("phone"),

                    email:
                        getValue("email"),

                    ndc_member:
                        ndc
                            ? ndc.value === "Yes"
                            : false,

                    ndc_card_number:
                        getValue("party_card"),

                    lga:
                        location.lga,

                    ward:
                        location.ward,

                    polling_unit:
                        location.polling_unit,

                    polling_unit_code:
                        location.polling_unit_code,

                    residence_country:
                        getValue("country"),

                    residence_state:
                        getValue("residence_state"),

                    residence_city:
                        getValue("city"),

                    occupation:
                        getValue("occupation"),

                    professional_skills:
                        getValue(
                            "professional_skills"
                        ),

                    interests:
                        interests,

                    reason_for_joining:
                        getValue("reason"),

                    declaration_confirmed:
                        document.getElementById(
                            "declaration"
                        ).checked,

                    declaration_name:
                        getValue(
                            "declaration_name"
                        ),

                    registration_date:
                        getValue(
                            "registration_date"
                        ),

                    passport_url:
                        passportPath,

                    membership_status:
                        "Pending"

                };


                /* =========================================
                   SECURE RPC
                   ========================================= */

                const {
                    data,
                    error
                } =
                    await db.rpc(
                        "register_membership",
                        {
                            p_member:
                                memberRecord
                        }
                    );


                if (error) {

                    throw error;

                }


                /* =========================================
                   MEMBERSHIP ID
                   ========================================= */

                const memberId =
                    data ||
                    "Your membership number";


                showSuccess(
                    memberId
                );


            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );


                confirmButton.disabled =
                    false;

                confirmButton.textContent =
                    "✓ Confirm & Submit";


                alert(
                    "We could not complete your registration.\n\n" +
                    error.message
                );

            }

        }
    );


    /* =====================================================
       SUCCESS SCREEN
       ===================================================== */

    function showSuccess(memberId) {

        setText(
            "successMemberId",
            memberId
        );

        setText(
            "successMemberName",
            getValue("fullname")
        );

        setText(
            "successRegistrationDate",
            formatDate(
                getValue("registration_date")
            )
        );


        preview.hidden = true;

        form.hidden = true;

        success.hidden = false;


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    /* =====================================================
       PRINT CONFIRMATION
       ===================================================== */

    printButton.addEventListener(
        "click",
        function () {

            window.print();

        }
    );


    /* =====================================================
       HELPERS
       ===================================================== */

    function getValue(id) {

        const element =
            document.getElementById(id);

        return element
            ? element.value.trim()
            : "";

    }


    function setPreview(
        id,
        value,
        fallback = "Not provided"
    ) {

        setText(
            id,
            value || fallback
        );

    }


    function setText(
        id,
        value
    ) {

        const element =
            document.getElementById(id);

        if (element) {

            element.textContent =
                value || "";

        }

    }


    function formatDate(value) {

        if (!value) return "";

        const date =
            new Date(
                value + "T00:00:00"
            );

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return value;

        }

        return date.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );

    }


    function escapeHTML(value) {

        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* =====================================================
       INITIALISE
       ===================================================== */

    loadImoElectoralData();

});
