      document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("membershipForm");
    const previewSection = document.getElementById("registrationPreview");
    const successSection = document.getElementById("registrationSuccess");

    const editButton = document.getElementById("editRegistration");
    const confirmButton = document.getElementById("confirmRegistration");

    const photoInput = document.getElementById("photo");
    const photoUpload = document.querySelector(".photo-upload");

    const lgaSelect = document.getElementById("lga");
    const wardSelect = document.getElementById("ward");
    const pollingUnitSelect = document.getElementById("polling_unit");

    let imoElectoralData = null;
    let selectedPhoto = null;

    /* =========================================================
       SUPABASE
    ========================================================= */

const SUPABASE_URL =
    "https://yopqftofkvwrpyyluffw.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_k3whUGyuDbdQU6GA6egeuQ_k-g-nFoL";

let db = null;

if (typeof window.supabase !== "undefined") {
    db = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );
}


    /* =========================================================
       REGISTRATION DATE
    ========================================================= */

    const registrationDate =
        document.getElementById("registration_date");

    if (registrationDate && !registrationDate.value) {
        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        registrationDate.value =
            `${year}-${month}-${day}`;
    }


    /* =========================================================
       LOAD IMO ELECTORAL DATA
    ========================================================= */

    async function loadImoElectoralData() {

        if (!lgaSelect) return;

        try {

            const response =
                await fetch("data/imo.json");

            if (!response.ok) {
                throw new Error(
                    "Unable to load electoral data."
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


    /* =========================================================
       POPULATE LGAs
    ========================================================= */

    function populateLGAs() {

        if (!lgaSelect || !imoElectoralData) return;

        lgaSelect.innerHTML =
            '<option value="">Select LGA</option>';

        imoElectoralData.state.lgas.forEach(function (lga) {

            const option =
                document.createElement("option");

            option.value = lga.name;
            option.textContent = lga.name;
            option.dataset.lgaId = lga.id;

            lgaSelect.appendChild(option);
        });
    }


    /* =========================================================
       LGA → WARD
    ========================================================= */

    if (lgaSelect) {

        lgaSelect.addEventListener(
            "change",
            function () {

                if (!imoElectoralData) return;

                const selectedLga =
                    imoElectoralData.state.lgas.find(
                        function (lga) {
                            return lga.name ===
                                lgaSelect.value;
                        }
                    );

                if (!wardSelect) return;

                wardSelect.innerHTML =
                    '<option value="">Select Ward</option>';

                if (pollingUnitSelect) {

                    pollingUnitSelect.innerHTML =
                        '<option value="">Select Polling Unit</option>';

                    pollingUnitSelect.disabled = true;
                }

                if (!selectedLga) {

                    wardSelect.disabled = true;
                    return;
                }

                selectedLga.wards.forEach(
                    function (ward) {

                        const option =
                            document.createElement("option");

                        option.value = ward.name;
                        option.textContent = ward.name;
                        option.dataset.wardId =
                            ward.id;

                        wardSelect.appendChild(option);
                    }
                );

                wardSelect.disabled = false;
            }
        );
    }


    /* =========================================================
       WARD → POLLING UNIT
    ========================================================= */

    if (wardSelect) {

        wardSelect.addEventListener(
            "change",
            function () {

                if (!imoElectoralData) return;

                const selectedLga =
                    imoElectoralData.state.lgas.find(
                        function (lga) {
                            return lga.name ===
                                lgaSelect.value;
                        }
                    );

                if (!selectedLga) return;

                const selectedWard =
                    selectedLga.wards.find(
                        function (ward) {
                            return ward.name ===
                                wardSelect.value;
                        }
                    );

                if (!pollingUnitSelect) return;

                pollingUnitSelect.innerHTML =
                    '<option value="">Select Polling Unit</option>';

                if (!selectedWard) {

                    pollingUnitSelect.disabled = true;
                    return;
                }

                selectedWard.pollingUnits.forEach(
                    function (unit) {

                        const option =
                            document.createElement("option");

                        option.value = unit.name;
                        option.textContent =
                            unit.name;

                        option.dataset.delimitation =
                            unit.delimitation;

                        pollingUnitSelect.appendChild(
                            option
                        );
                    }
                );

                pollingUnitSelect.disabled = false;
            }
        );
    }


    /* =========================================================
       PHOTO SELECTION
    ========================================================= */

    if (photoInput) {

        photoInput.addEventListener(
            "change",
            function () {

                const file =
                    photoInput.files[0];

                if (!file) return;

                const allowedTypes = [
                    "image/jpeg",
                    "image/png",
                    "image/webp"
                ];

                if (!allowedTypes.includes(file.type)) {

                    alert(
                        "Please select a JPG, PNG or WebP image."
                    );

                    photoInput.value = "";
                    selectedPhoto = null;
                    return;
                }

                if (file.size > 2 * 1024 * 1024) {

                    alert(
                        "The photograph must not exceed 2MB."
                    );

                    photoInput.value = "";
                    selectedPhoto = null;
                    return;
                }

                selectedPhoto = file;

                showPhotoPreview(file);
            }
        );
    }


    /* =========================================================
       PHOTO PREVIEW
    ========================================================= */

    function showPhotoPreview(file) {

        if (!photoUpload) return;

        const reader =
            new FileReader();

        reader.onload = function (event) {

            photoUpload.innerHTML = "";

            const container =
                document.createElement("div");

            container.className =
                "photo-preview-container";

            const image =
                document.createElement("img");

            image.className =
                "photo-preview-image";

            image.src =
                event.target.result;

            image.alt =
                "Selected passport photograph";

            const info =
                document.createElement("div");

            info.className =
                "photo-upload-success";

            info.innerHTML =
                "<strong>Photograph selected</strong>" +
                "<br>" +
                file.name +
                "<br>" +
                formatFileSize(file.size);

            const changeButton =
                document.createElement("button");

            changeButton.type =
                "button";

            changeButton.className =
                "change-photo-button";

            changeButton.textContent =
                "Change Photograph";

            changeButton.addEventListener(
                "click",
                function () {

                    photoInput.click();
                }
            );

            container.appendChild(image);
            container.appendChild(info);
            container.appendChild(changeButton);

            photoUpload.appendChild(container);
        };

        reader.readAsDataURL(file);
    }


    function formatFileSize(bytes) {

        if (bytes < 1024) {
            return bytes + " bytes";
        }

        if (bytes < 1024 * 1024) {
            return (
                (bytes / 1024).toFixed(1) +
                " KB"
            );
        }

        return (
            (bytes / (1024 * 1024)).toFixed(2) +
            " MB"
        );
    }


    /* =========================================================
       PREVIEW HELPER
    ========================================================= */

    function setPreview(id, value) {

        const element =
            document.getElementById(id);

        if (!element) return;

        element.textContent =
            value || "Not provided";
    }


    /* =========================================================
       COLLECT INTERESTS
    ========================================================= */

    function getInterests() {

        const checked =
            document.querySelectorAll(
                'input[name="interest"]:checked'
            );

        return Array.from(checked).map(
            function (item) {
                return item.value;
            }
        );
    }


    /* =========================================================
       PREPARE PREVIEW
    ========================================================= */

    function preparePreview() {

        setPreview(
            "previewFullname",
            document.getElementById("fullname").value
        );

        setPreview(
            "previewDob",
            document.getElementById("dob").value
        );

        setPreview(
            "previewGender",
            document.getElementById("gender").value
        );

        setPreview(
            "previewPhone",
            document.getElementById("phone").value
        );

        setPreview(
            "previewEmail",
            document.getElementById("email").value
        );

        const ndcMember =
            document.querySelector(
                'input[name="ndc_member"]:checked'
            );

        setPreview(
            "previewNdcMember",
            ndcMember ? ndcMember.value : ""
        );

        setPreview(
            "previewPartyCard",
            document.getElementById("party_card").value
        );

        setPreview(
            "previewLga",
            lgaSelect.value
        );

        setPreview(
            "previewWard",
            wardSelect.value
        );

        setPreview(
            "previewPollingUnit",
            pollingUnitSelect.value
        );

        const selectedPolling =
            pollingUnitSelect.options[
                pollingUnitSelect.selectedIndex
            ];

        setPreview(
            "previewPollingCode",
            selectedPolling
                ? selectedPolling.dataset.delimitation || ""
                : ""
        );

        setPreview(
            "previewCountry",
            document.getElementById("country").value
        );

        setPreview(
            "previewResidenceState",
            document.getElementById(
                "residence_state"
            ).value
        );

        setPreview(
            "previewCity",
            document.getElementById("city").value
        );

        setPreview(
            "previewOccupation",
            document.getElementById("occupation").value
        );

        setPreview(
            "previewSkills",
            document.getElementById(
                "professional_skills"
            ).value
        );

        const interests =
            getInterests();

        setPreview(
            "previewInterests",
            interests.length
                ? interests.join(", ")
                : "None selected"
        );

        setPreview(
            "previewReason",
            document.getElementById(
                "reason"
            ).value
        );

        setPreview(
            "previewDeclarationName",
            document.getElementById(
                "declaration_name"
            ).value
        );

        setPreview(
            "previewRegistrationDate",
            document.getElementById(
                "registration_date"
            ).value
        );


        /* Photo preview */

        const previewPhoto =
            document.getElementById(
                "previewPhoto"
            );

        if (previewPhoto && selectedPhoto) {

            const reader =
                new FileReader();

            reader.onload = function (event) {

                previewPhoto.src =
                    event.target.result;

                previewPhoto.style.display =
                    "block";
            };

            reader.readAsDataURL(
                selectedPhoto
            );
        }
    }


    /* =========================================================
       FORM SUBMISSION → PREVIEW
    ========================================================= */

    if (form) {

        form.addEventListener(
            "submit",
            function (event) {

                /*
                 * VERY IMPORTANT:
                 * Stop the browser from submitting/reloading.
                 */
                event.preventDefault();
                event.stopPropagation();

                console.log(
                    "Preview button clicked."
                );

                if (!form.checkValidity()) {

                    form.reportValidity();

                    return;
                }

                preparePreview();

                form.style.display =
                    "none";

                if (previewSection) {

                    previewSection.hidden =
                        false;

                    previewSection.style.display =
                        "block";

                    previewSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            }
        );
    }


    /* =========================================================
       EDIT REGISTRATION
    ========================================================= */

    if (editButton) {

        editButton.addEventListener(
            "click",
            function () {

                if (previewSection) {

                    previewSection.hidden =
                        true;

                    previewSection.style.display =
                        "none";
                }

                if (form) {

                    form.style.display =
                        "";

                    form.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            }
        );
    }

/* =========================================================
   CONFIRM & SUBMIT
========================================================= */

if (confirmButton) {

    confirmButton.addEventListener(
        "click",
        async function () {

            if (!db) {

                alert(
                    "The membership system is not connected to Supabase. Please check the Supabase publishable key in membership.js."
                );

                return;
            }

            confirmButton.disabled = true;

            confirmButton.textContent =
                "Submitting...";

            try {

                let passportUrl = "";

                /* =====================================================
                   UPLOAD PHOTOGRAPH
                ===================================================== */

                if (selectedPhoto) {

                    const extension =
                        selectedPhoto.name
                            .split(".")
                            .pop()
                            .toLowerCase();

                    const fileName =
                        "members/" +
                        crypto.randomUUID() +
                        "." +
                        extension;

                    const upload =
                        await db.storage
                            .from("member-photos")
                            .upload(
                                fileName,
                                selectedPhoto,
                                {
                                    contentType:
                                        selectedPhoto.type,
                                    upsert: false
                                }
                            );

                    if (upload.error) {
                        throw upload.error;
                    }

                    passportUrl =
                        fileName;
                }


                /* =====================================================
                   COLLECT FORM DATA
                ===================================================== */

                const interests =
                    getInterests();

                const ndcMember =
                    document.querySelector(
                        'input[name="ndc_member"]:checked'
                    );


                const selectedPolling =
                    pollingUnitSelect.options[
                        pollingUnitSelect.selectedIndex
                    ];


                const memberRecord = {

                    full_name:
                        document.getElementById(
                            "fullname"
                        ).value,

                    date_of_birth:
                        document.getElementById(
                            "dob"
                        ).value,

                    gender:
                        document.getElementById(
                            "gender"
                        ).value,

                    phone:
                        document.getElementById(
                            "phone"
                        ).value,

                    email:
                        document.getElementById(
                            "email"
                        ).value,

                    ndc_member:
                        ndcMember
                            ? ndcMember.value === "Yes"
                            : false,

                    ndc_card_number:
                        document.getElementById(
                            "party_card"
                        ).value,

                    lga:
                        lgaSelect.value,

                    ward:
                        wardSelect.value,

                    polling_unit:
                        pollingUnitSelect.value,

                    polling_unit_code:
                        selectedPolling
                            ? selectedPolling.dataset.delimitation || ""
                            : "",

                    residence_country:
                        document.getElementById(
                            "country"
                        ).value,

                    residence_state:
                        document.getElementById(
                            "residence_state"
                        ).value,

                    residence_city:
                        document.getElementById(
                            "city"
                        ).value,

                    occupation:
                        document.getElementById(
                            "occupation"
                        ).value,

                    professional_skills:
                        document.getElementById(
                            "professional_skills"
                        ).value,

                    interests:
                        interests,

                    reason_for_joining:
                        document.getElementById(
                            "reason"
                        ).value,

                    declaration_confirmed:
                        document.getElementById(
                            "declaration"
                        ).checked,

                    declaration_name:
                        document.getElementById(
                            "declaration_name"
                        ).value,

                    registration_date:
                        document.getElementById(
                            "registration_date"
                        ).value,

                    passport_url:
                        passportUrl
                };


                /* =====================================================
                   SEND TO SECURE SUPABASE RPC
                ===================================================== */

                const {
                    data,
                    error
                } = await db.rpc(
                    "register_membership",
                    {
                        p_member:
                            memberRecord
                    }
                );


                if (error) {
                    throw error;
                }


                /* =====================================================
                   DUPLICATE PHONE REGISTRATION
                ===================================================== */

                if (data === "DUPLICATE_PHONE") {

                    confirmButton.disabled = false;

                    confirmButton.textContent =
                        "Confirm & Submit";

                    alert(
                        "Registration Already Exists\n\n" +
                        "A membership registration already exists " +
                        "for this phone number.\n\n" +
                        "Please do not submit another registration. " +
                        "If you believe this is an error, please contact " +
                        "the Ochoudo Mandate Group."
                    );

                    return;
                }


                /* =====================================================
                   MEMBERSHIP ID
                ===================================================== */

                const memberId =
                    data ||
                    "Your membership number";


                /* =====================================================
                   HIDE PREVIEW
                ===================================================== */

                if (previewSection) {

                    previewSection.hidden =
                        true;

                    previewSection.style.display =
                        "none";
                }


                /* =====================================================
                   POPULATE FINAL MEMBERSHIP CARD
                ===================================================== */

                setPreview(
                    "successMemberId",
                    memberId
                );

                setPreview(
                    "successMemberName",
                    document.getElementById(
                        "fullname"
                    ).value
                );

                setPreview(
                    "successMemberGender",
                    document.getElementById(
                        "gender"
                    ).value
                );

                setPreview(
                    "successMemberLga",
                    lgaSelect.value
                );

                setPreview(
                    "successMemberWard",
                    wardSelect.value
                );

                setPreview(
                    "successMemberPollingUnit",
                    pollingUnitSelect.value
                );

                setPreview(
                    "successRegistrationDate",
                    document.getElementById(
                        "registration_date"
                    ).value
                );


                /* =====================================================
                   DISPLAY ACTUAL UPLOADED PHOTOGRAPH
                ===================================================== */

                const successPhoto =
                    document.getElementById(
                        "successMemberPhoto"
                    );

                if (
                    successPhoto &&
                    selectedPhoto
                ) {

                    const photoReader =
                        new FileReader();

                    photoReader.onload =
                        function (event) {

                            successPhoto.src =
                                event.target.result;

                        };

                    photoReader.readAsDataURL(
                        selectedPhoto
                    );
                }


                /* =====================================================
                   SHOW SUCCESS / MEMBERSHIP CARD
                ===================================================== */

                if (successSection) {

                    successSection.hidden =
                        false;

                    successSection.style.display =
                        "block";

                    successSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }


            } catch (error) {

                console.error(
                    "Membership submission error:",
                    error
                );

                confirmButton.disabled =
                    false;

                confirmButton.textContent =
                    "Confirm & Submit";


                alert(
                    "We could not complete your registration. " +
                    "Please try again."
                );
            }

        }
    );
}

                    /* Show success */
/* =========================================================
   POPULATE FINAL MEMBERSHIP CARD
========================================================= */

setPreview(
    "successMemberId",
    memberId
);

setPreview(
    "successMemberName",
    document.getElementById(
        "fullname"
    ).value
);

setPreview(
    "successMemberGender",
    document.getElementById(
        "gender"
    ).value
);

setPreview(
    "successMemberLga",
    lgaSelect.value
);

setPreview(
    "successMemberWard",
    wardSelect.value
);

setPreview(
    "successMemberPollingUnit",
    pollingUnitSelect.value
);

setPreview(
    "successRegistrationDate",
    document.getElementById(
        "registration_date"
    ).value
);


/* Display the actual uploaded photograph */

const successPhoto =
    document.getElementById(
        "successMemberPhoto"
    );

if (successPhoto && selectedPhoto) {

    const photoReader =
        new FileReader();

    photoReader.onload =
        function (event) {

            successPhoto.src =
                event.target.result;
        };

    photoReader.readAsDataURL(
        selectedPhoto
    );
}

                    if (successSection) {

                        successSection.hidden =
                            false;

                        successSection.style.display =
                            "block";

                        successSection.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });
                    }

                } catch (error) {

                    console.error(
                        "Membership submission error:",
                        error
                    );

                    alert(
                        "We could not complete your registration. Please try again."
                    );

                    confirmButton.disabled =
                        false;

                    confirmButton.textContent =
                        "Confirm & Submit";
                }
            }
        );
    }


    /* =========================================================
       PRINT CONFIRMATION
    ========================================================= */

    const printButton =
        document.getElementById(
            "printConfirmation"
        );

    if (printButton) {

        printButton.addEventListener(
            "click",
            function () {

                window.print();

            }
        );
    }


    /* =========================================================
       START
    ========================================================= */

    loadImoElectoralData();

});
