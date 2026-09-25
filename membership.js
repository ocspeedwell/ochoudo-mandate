document.addEventListener("DOMContentLoaded", function () {

    /* =========================================================
       ELEMENTS
    ========================================================= */

    const form = document.getElementById("membershipForm");
    const previewSection = document.getElementById("registrationPreview");
    const successSection = document.getElementById("registrationSuccess");

    const editButton = document.getElementById("editRegistration");
    const confirmButton = document.getElementById("confirmRegistration");

    const photoInput = document.getElementById("photo");
    const cameraPhotoInput = document.getElementById("cameraPhoto");
    const openCameraButton = document.getElementById("openCamera");
    const openGalleryButton = document.getElementById("openGallery");
    const photoUpload = document.querySelector(".photo-upload");

    const lgaSelect = document.getElementById("lga");
    const wardSelect = document.getElementById("ward");
    const pollingUnitSelect = document.getElementById("polling_unit");

    const phoneInput = document.getElementById("phone");

    let imoElectoralData = null;
    let selectedPhoto = null;
/* =========================================================
   FORCE TEXT ENTRY TO UPPERCASE
   ========================================================= */

const uppercaseFieldIds = [
    "fullname",
    "gender",
    "email",
    "party_card",
    "country",
    "residence_state",
    "city",
    "occupation",
    "professional_skills",
    "reason",
    "declaration_name"
];

uppercaseFieldIds.forEach(function (fieldId) {
    const field = document.getElementById(fieldId);

    if (!field) return;

    field.addEventListener("input", function () {

        const start = field.selectionStart;
        const end = field.selectionEnd;

        field.value = field.value.toUpperCase();

        if (
            typeof start === "number" &&
            typeof end === "number"
        ) {
            field.setSelectionRange(start, end);
        }
    });

    field.value = field.value.toUpperCase();
});

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
       PHONE VALIDATION
    ========================================================= */

    function normalizePhoneNumber(phone) {

        let value =
            String(phone || "")
                .trim()
                .replace(/\s+/g, "")
                .replace(/-/g, "")
                .replace(/\(/g, "")
                .replace(/\)/g, "");


        if (value.startsWith("+234")) {

            value =
                "234" +
                value.substring(4);

        }


        if (/^0[0-9]{10}$/.test(value)) {

            value =
                "234" +
                value.substring(1);

        }


        return value;
    }


    function isValidNigerianPhone(phone) {

        return /^234[0-9]{10}$/.test(
            normalizePhoneNumber(phone)
        );

    }


    /* =========================================================
       REGISTRATION DATE
    ========================================================= */

    const registrationDate =
        document.getElementById("registration_date");


    if (
        registrationDate &&
        !registrationDate.value
    ) {

        const today =
            new Date();


        const year =
            today.getFullYear();


        const month =
            String(
                today.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                today.getDate()
            ).padStart(
                2,
                "0"
            );


        registrationDate.value =
            `${year}-${month}-${day}`;

    }


    /* =========================================================
       LOAD IMO ELECTORAL DATA
    ========================================================= */

    async function loadImoElectoralData() {

        if (!lgaSelect) {
            return;
        }


        try {

            const response =
                await fetch(
                    "data/imo.json",
                    {
                        cache: "no-store"
                    }
                );


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


            lgaSelect.innerHTML =
                '<option value="">Unable to load LGAs</option>';


            lgaSelect.disabled =
                true;

        }

    }


    /* =========================================================
       POPULATE LGAs
    ========================================================= */

    function populateLGAs() {

        if (
            !lgaSelect ||
            !imoElectoralData
        ) {
            return;
        }


        lgaSelect.innerHTML =
            '<option value="">Select LGA</option>';


        const lgas =
            imoElectoralData.state &&
            Array.isArray(
                imoElectoralData.state.lgas
            )
                ? imoElectoralData.state.lgas
                : [];


        lgas.forEach(
            function (lga) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    lga.name;


                option.textContent =
                    lga.name;


                option.dataset.lgaId =
                    lga.id || "";


                lgaSelect.appendChild(
                    option
                );

            }
        );


        lgaSelect.disabled =
            false;


        if (wardSelect) {

            wardSelect.innerHTML =
                '<option value="">Select Ward</option>';

            wardSelect.disabled =
                true;

        }


        if (pollingUnitSelect) {

            pollingUnitSelect.innerHTML =
                '<option value="">Select Polling Unit</option>';

            pollingUnitSelect.disabled =
                true;

        }

    }


    /* =========================================================
       LGA → WARD
    ========================================================= */

    if (lgaSelect) {

        lgaSelect.addEventListener(
            "change",
            function () {

                if (!imoElectoralData) {
                    return;
                }


                const selectedLga =
                    imoElectoralData.state.lgas.find(
                        function (lga) {

                            return (
                                lga.name ===
                                lgaSelect.value
                            );

                        }
                    );


                if (!wardSelect) {
                    return;
                }


                wardSelect.innerHTML =
                    '<option value="">Select Ward</option>';


                if (pollingUnitSelect) {

                    pollingUnitSelect.innerHTML =
                        '<option value="">Select Polling Unit</option>';

                    pollingUnitSelect.disabled =
                        true;

                }


                if (!selectedLga) {

                    wardSelect.disabled =
                        true;

                    return;

                }


                const wards =
                    Array.isArray(
                        selectedLga.wards
                    )
                        ? selectedLga.wards
                        : [];


                wards.forEach(
                    function (ward) {

                        const option =
                            document.createElement(
                                "option"
                            );


                        option.value =
                            ward.name;


                        option.textContent =
                            ward.name;


                        option.dataset.wardId =
                            ward.id || "";


                        wardSelect.appendChild(
                            option
                        );

                    }
                );


                wardSelect.disabled =
                    false;

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

                if (
                    !imoElectoralData ||
                    !lgaSelect
                ) {
                    return;
                }


                const selectedLga =
                    imoElectoralData.state.lgas.find(
                        function (lga) {

                            return (
                                lga.name ===
                                lgaSelect.value
                            );

                        }
                    );


                if (
                    !selectedLga ||
                    !pollingUnitSelect
                ) {
                    return;
                }


                const selectedWard =
                    selectedLga.wards.find(
                        function (ward) {

                            return (
                                ward.name ===
                                wardSelect.value
                            );

                        }
                    );


                pollingUnitSelect.innerHTML =
                    '<option value="">Select Polling Unit</option>';


                if (!selectedWard) {

                    pollingUnitSelect.disabled =
                        true;

                    return;

                }


                const pollingUnits =
                    Array.isArray(
                        selectedWard.pollingUnits
                    )
                        ? selectedWard.pollingUnits
                        : [];


                pollingUnits.forEach(
                    function (unit) {

                        const option =
                            document.createElement(
                                "option"
                            );


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


                pollingUnitSelect.disabled =
                    false;

            }
        );

    }


    /* =========================================================
       PHOTO SELECTION
       Camera + Gallery + automatic image compression
    ========================================================= */

    const MAX_PHOTO_SIZE = 900 * 1024; // Keep uploads comfortably below 1 MB
    const MAX_PHOTO_DIMENSION = 1200;
    const JPEG_QUALITY_START = 0.78;

    function setPhotoInputFile(file) {
        if (!photoInput || !file) return;

        try {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            photoInput.files = dataTransfer.files;
        } catch (error) {
            console.warn("Could not copy processed photograph into #photo.", error);
        }
    }

    function createPhotoFile(blob, originalFile) {
        const baseName =
            (originalFile && originalFile.name
                ? originalFile.name.replace(/\.[^/.]+$/, "")
                : "passport-photograph");

        return new File(
            [blob],
            baseName + ".jpg",
            {
                type: "image/jpeg",
                lastModified: Date.now()
            }
        );
    }

    function loadImageFromFile(file) {
        return new Promise(function (resolve, reject) {
            const url = URL.createObjectURL(file);
            const image = new Image();

            image.onload = function () {
                URL.revokeObjectURL(url);
                resolve(image);
            };

            image.onerror = function () {
                URL.revokeObjectURL(url);
                reject(new Error("The selected image could not be read."));
            };

            image.src = url;
        });
    }

    function canvasToBlob(canvas, quality) {
        return new Promise(function (resolve, reject) {
            canvas.toBlob(
                function (blob) {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("The browser could not process the photograph."));
                    }
                },
                "image/jpeg",
                quality
            );
        });
    }

    async function compressPhoto(file) {
        if (!file) {
            throw new Error("No photograph was selected.");
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            throw new Error("Please select a JPG, PNG or WebP image.");
        }

        // Always normalize the image through canvas so camera/gallery files
        // have predictable JPEG format, dimensions, and metadata.
        const image = await loadImageFromFile(file);

        let width = image.naturalWidth || image.width;
        let height = image.naturalHeight || image.height;

        const scale = Math.min(
            1,
            MAX_PHOTO_DIMENSION / Math.max(width, height)
        );

        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d", {
            alpha: false
        });

        if (!context) {
            throw new Error("Your browser could not prepare the photograph.");
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);

        let quality = JPEG_QUALITY_START;
        let blob = await canvasToBlob(canvas, quality);

        // Gradually reduce JPEG quality if necessary.
        while (blob.size > MAX_PHOTO_SIZE && quality > 0.45) {
            quality -= 0.07;
            blob = await canvasToBlob(canvas, quality);
        }

        // If still too large, reduce dimensions and try again.
        while (blob.size > MAX_PHOTO_SIZE && Math.max(width, height) > 900) {
            width = Math.max(1, Math.round(width * 0.82));
            height = Math.max(1, Math.round(height * 0.82));

            canvas.width = width;
            canvas.height = height;

            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, width, height);
            context.drawImage(image, 0, 0, width, height);

            quality = 0.60;
            blob = await canvasToBlob(canvas, quality);
        }

        if (blob.size > MAX_PHOTO_SIZE) {
            throw new Error("The photograph could not be reduced below 2MB.");
        }

        return createPhotoFile(blob, file);
    }

    async function processSelectedPhoto(file) {
        if (!file) return;

        try {
            if (photoUpload) {
                photoUpload.classList.add("photo-processing");
            }

            const processedFile = await compressPhoto(file);

            selectedPhoto = processedFile;
            setPhotoInputFile(processedFile);

            showPhotoPreview(processedFile);

            const selectedName =
                document.getElementById("selectedPhotoName");

            if (selectedName) {
                selectedName.textContent =
                    processedFile.name +
                    " • " +
                    formatFileSize(processedFile.size);
            }

        } catch (error) {
            console.error("Photograph processing error:", error);

            alert(
                error && error.message
                    ? error.message
                    : "We could not process this photograph. Please try another image."
            );

            if (photoInput) {
                photoInput.value = "";
            }

            if (cameraPhotoInput) {
                cameraPhotoInput.value = "";
            }

            selectedPhoto = null;

        } finally {
            if (photoUpload) {
                photoUpload.classList.remove("photo-processing");
            }
        }
    }

    // Gallery button opens the normal #photo file picker.
    if (openGalleryButton && photoInput) {
        openGalleryButton.addEventListener("click", function () {
            photoInput.click();
        });
    }

    // Camera button opens the dedicated camera input.
    if (openCameraButton && cameraPhotoInput) {
        openCameraButton.addEventListener("click", function () {
            cameraPhotoInput.click();
        });
    }

    // Gallery selection.
    if (photoInput) {
        photoInput.addEventListener("change", function () {
            const file =
                photoInput.files &&
                photoInput.files[0];

            if (file) {
                processSelectedPhoto(file);
            }
        });
    }

    // Camera capture.
    if (cameraPhotoInput) {
        cameraPhotoInput.addEventListener("change", function () {
            const file =
                cameraPhotoInput.files &&
                cameraPhotoInput.files[0];

            if (file) {
                processSelectedPhoto(file);
            }
        });
    }

    /* =========================================================
       PHOTO PREVIEW
    ========================================================= */

    function showPhotoPreview(file) {

        if (!photoUpload) {
            return;
        }


        const imageUrl =
            URL.createObjectURL(
                file
            );


        photoUpload.innerHTML =
            "";


        const container =
            document.createElement(
                "div"
            );


        container.className =
            "photo-preview-container";


        const image =
            document.createElement(
                "img"
            );


        image.className =
            "photo-preview-image";


        image.src =
            imageUrl;


        image.alt =
            "Selected passport photograph";


        image.onload =
            function () {

                URL.revokeObjectURL(
                    imageUrl
                );

            };


        const info =
            document.createElement(
                "div"
            );


        info.className =
            "photo-upload-success";


        info.innerHTML =
            "<strong>Photograph selected</strong>" +
            "<br>" +
            escapeHtml(
                file.name
            ) +
            "<br>" +
            formatFileSize(
                file.size
            );


        const changeButton =
            document.createElement(
                "button"
            );


        changeButton.type =
            "button";


        changeButton.className =
            "change-photo-button";


        changeButton.textContent =
            "Change Photograph";


        changeButton.addEventListener(
            "click",
            function () {

                if (openGalleryButton) {
                    openGalleryButton.click();
                } else if (photoInput) {
                    photoInput.click();
                }

            }
        );


        container.appendChild(
            image
        );


        container.appendChild(
            info
        );


        container.appendChild(
            changeButton
        );


        photoUpload.appendChild(
            container
        );

    }


    function formatFileSize(bytes) {

        if (bytes < 1024) {

            return (
                bytes +
                " bytes"
            );

        }


        if (
            bytes <
            1024 * 1024
        ) {

            return (
                (bytes / 1024)
                    .toFixed(1) +
                " KB"
            );

        }


        return (
            (
                bytes /
                (1024 * 1024)
            ).toFixed(2) +
            " MB"
        );

    }


    function escapeHtml(value) {

        return String(
            value || ""
        )
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


    /* =========================================================
       PREVIEW HELPER
    ========================================================= */
function setPreview(id, value) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.textContent =
        typeof value === "string"
            ? (value.toUpperCase() || "Not provided")
            : (value || "Not provided");
}

    /* =========================================================
       COLLECT INTERESTS
    ========================================================= */

    function getInterests() {

        const checked =
            document.querySelectorAll(
                'input[name="interest"]:checked'
            );


        return Array.from(
            checked
        ).map(
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
            document.getElementById(
                "fullname"
            ).value
        );


        setPreview(
            "previewDob",
            document.getElementById(
                "dob"
            ).value
        );


        setPreview(
            "previewGender",
            document.getElementById(
                "gender"
            ).value
        );


        setPreview(
            "previewPhone",
            document.getElementById(
                "phone"
            ).value
        );


        setPreview(
            "previewEmail",
            document.getElementById(
                "email"
            ).value
        );


        const ndcMember =
            document.querySelector(
                'input[name="ndc_member"]:checked'
            );


        setPreview(
            "previewNdcMember",
            ndcMember
                ? ndcMember.value
                : ""
        );


        setPreview(
            "previewPartyCard",
            document.getElementById(
                "party_card"
            ).value
        );


        setPreview(
            "previewLga",
            lgaSelect
                ? lgaSelect.value
                : ""
        );


        setPreview(
            "previewWard",
            wardSelect
                ? wardSelect.value
                : ""
        );


        setPreview(
            "previewPollingUnit",
            pollingUnitSelect
                ? pollingUnitSelect.value
                : ""
        );


        const selectedPolling =
            pollingUnitSelect &&
            pollingUnitSelect.selectedIndex >= 0
                ? pollingUnitSelect.options[
                    pollingUnitSelect.selectedIndex
                ]
                : null;


        setPreview(
            "previewPollingCode",
            selectedPolling
                ? selectedPolling.dataset.delimitation || ""
                : ""
        );


        setPreview(
            "previewCountry",
            document.getElementById(
                "country"
            ).value
        );


        setPreview(
            "previewResidenceState",
            document.getElementById(
                "residence_state"
            ).value
        );


        setPreview(
            "previewCity",
            document.getElementById(
                "city"
            ).value
        );


        setPreview(
            "previewOccupation",
            document.getElementById(
                "occupation"
            ).value
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


        /* =====================================================
           PHOTO PREVIEW
        ===================================================== */

        const previewPhoto =
            document.getElementById(
                "previewPhoto"
            );


        if (
            previewPhoto &&
            selectedPhoto
        ) {

            const previewUrl =
                URL.createObjectURL(
                    selectedPhoto
                );


            previewPhoto.src =
                previewUrl;


            previewPhoto.style.display =
                "block";


            previewPhoto.onload =
                function () {

                    URL.revokeObjectURL(
                        previewUrl
                    );

                };

        }

    }


    /* =========================================================
       FORM SUBMISSION → PREVIEW
    ========================================================= */

    if (form) {

        form.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();
                event.stopPropagation();


                console.log(
                    "Membership form submitted. Preparing preview."
                );


                if (
                    !form.checkValidity()
                ) {

                    form.reportValidity();

                    return;

                }


                /* =================================================
                   PHONE VALIDATION
                ================================================= */

                if (
                    phoneInput &&
                    !isValidNigerianPhone(
                        phoneInput.value
                    )
                ) {

                    alert(
                        "Please enter a valid Nigerian phone number.\n\n" +
                        "Example: 08012345678"
                    );


                    phoneInput.focus();


                    return;

                }


                /* =================================================
                   PHOTO REQUIRED
                ================================================= */

                if (
                    !selectedPhoto &&
                    photoInput &&
                    photoInput.required
                ) {

                    alert(
                        "Please select your passport photograph."
                    );


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
                        behavior:
                            "smooth",

                        block:
                            "start"
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
                        behavior:
                            "smooth",

                        block:
                            "start"
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
                        "The membership system is not connected to Supabase. Please refresh the page and try again."
                    );


                    return;

                }


                if (!form) {
                    return;
                }


                /* =================================================
                   VALIDATE PHONE AGAIN
                ================================================= */

                if (
                    phoneInput &&
                    !isValidNigerianPhone(
                        phoneInput.value
                    )
                ) {

                    alert(
                        "Please enter a valid Nigerian phone number.\n\n" +
                        "Example: 08012345678"
                    );


                    phoneInput.focus();


                    return;

                }


                /* =================================================
                   MAKE SURE PHOTO EXISTS
                ================================================= */

                if (
                    !selectedPhoto &&
                    photoInput &&
                    photoInput.required
                ) {

                    alert(
                        "Please select your passport photograph."
                    );


                    return;

                }


                confirmButton.disabled =
                    true;


                confirmButton.textContent =
                    "Submitting...";


                try {

                    /* =================================================
                       UPLOAD PHOTOGRAPH
                    ================================================= */

                    let passportUrl =
                        "";


                    if (selectedPhoto) {

                        // Always upload a normalized JPEG with explicit metadata.
                        const uploadFile =
                            selectedPhoto.type === "image/jpeg"
                                ? selectedPhoto
                                : new File(
                                    [selectedPhoto],
                                    "passport-photograph.jpg",
                                    {
                                        type: "image/jpeg",
                                        lastModified: Date.now()
                                    }
                                );

                        const fileName =
                            "members/" +
                            crypto.randomUUID() +
                            ".jpg";

                        console.log(
                            "Uploading photograph:",
                            fileName,
                            "size:",
                            uploadFile.size,
                            "type:",
                            uploadFile.type
                        );

                        const upload =
                            await db.storage
                                .from("member-photos")
                                .upload(
                                    fileName,
                                    uploadFile,
                                    {
                                        contentType: "image/jpeg",
                                        cacheControl: "3600",
                                        upsert: false
                                    }
                                );

                        if (upload.error) {

                            console.error(
                                "Supabase photo upload error:",
                                upload.error
                            );

                            throw new Error(
                                "PHOTO_UPLOAD_FAILED: " +
                                (
                                    upload.error.message ||
                                    upload.error.error_description ||
                                    upload.error.name ||
                                    "Supabase rejected the photograph upload."
                                )
                            );
                        }

                        passportUrl = fileName;

                        console.log(
                            "Photograph uploaded successfully."
                        );

                    }


                    /* =================================================
                       COLLECT INTERESTS
                    ================================================= */

                    const interests =
                        getInterests();


                    const ndcMember =
                        document.querySelector(
                            'input[name="ndc_member"]:checked'
                        );


                    const selectedPolling =
                        pollingUnitSelect &&
                        pollingUnitSelect.selectedIndex >= 0
                            ? pollingUnitSelect.options[
                                pollingUnitSelect.selectedIndex
                            ]
                            : null;


                    /* =================================================
                       CREATE MEMBER RECORD
                    ================================================= */

                    const memberRecord = {

                        full_name:
    document.getElementById(
        "fullname"
    ).value.toUpperCase(),


                        date_of_birth:
                            document.getElementById(
                                "dob"
                            ).value,


                       gender:
    document.getElementById(
        "gender"
    ).value.toUpperCase(),


                        phone:
                            normalizePhoneNumber(
                                document.getElementById(
                                    "phone"
                                ).value
                            ),


                        email:
                            document.getElementById(
                                "email"
                            ).value.toUpperCase(),


                        ndc_member:
                            ndcMember
                                ? ndcMember.value === "Yes"
                                : false,


                        ndc_card_number:
                            document.getElementById(
                                "party_card"
                            ).value,


                        lga:
                            lgaSelect
                                ? lgaSelect.value
                                : "",


                        ward:
                            wardSelect
                                ? wardSelect.value
                                : "",


                        polling_unit:
                            pollingUnitSelect
                                ? pollingUnitSelect.value
                                : "",


                        polling_unit_code:
                            selectedPolling
                                ? selectedPolling.dataset.delimitation || ""
                                : "",


                        residence_country:
                            document.getElementById(
                                "country"
                             ).value.toUpperCase(),


                        residence_state:
                            document.getElementById(
                                "residence_state"
                            ).value.toUpperCase(),


                        residence_city:
                            document.getElementById(
                                "city"
                            ).value.toUpperCase(),


                        occupation:
                            document.getElementById(
                                "occupation"
                             ).value.toUpperCase(),


                        professional_skills:
                            document.getElementById(
                                "professional_skills"
                            ).value.toUpperCase(),


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
                            ).value.toUpperCase(),


                        passport_url:
                            passportUrl

                    };


                    console.log(
                        "Submitting membership record."
                    );


                    /* =================================================
                       SEND TO SECURE SUPABASE RPC
                    ================================================= */

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

                        console.error(
                            "Membership RPC error:",
                            error
                        );


                        throw error;

                    }


                    /* =================================================
                       DUPLICATE PHONE
                    ================================================= */

                    if (
                        data ===
                        "DUPLICATE_PHONE"
                    ) {

                        confirmButton.disabled =
                            false;


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


                    /* =================================================
                       MEMBERSHIP ID
                    ================================================= */

                    const memberId =
                        data ||
                        "Your membership number";


                    /* =================================================
                       HIDE PREVIEW
                    ================================================= */

                    if (previewSection) {

                        previewSection.hidden =
                            true;


                        previewSection.style.display =
                            "none";

                    }


                    /* =================================================
                       POPULATE MEMBERSHIP CARD
                    ================================================= */

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
                        lgaSelect
                            ? lgaSelect.value
                            : ""
                    );


                    setPreview(
                        "successMemberWard",
                        wardSelect
                            ? wardSelect.value
                            : ""
                    );


                    setPreview(
                        "successMemberPollingUnit",
                        pollingUnitSelect
                            ? pollingUnitSelect.value
                            : ""
                    );


                    setPreview(
                        "successRegistrationDate",
                        document.getElementById(
                            "registration_date"
                        ).value
                    );


                    /* =================================================
                       DISPLAY PHOTO ON FINAL CARD
                    ================================================= */

                    const successPhoto =
                        document.getElementById(
                            "successMemberPhoto"
                        );


                    if (
                        successPhoto &&
                        selectedPhoto
                    ) {

                        const successPhotoUrl =
                            URL.createObjectURL(
                                selectedPhoto
                            );


                        successPhoto.src =
                            successPhotoUrl;


                        successPhoto.style.display =
                            "block";


                        successPhoto.onload =
                            function () {

                                URL.revokeObjectURL(
                                    successPhotoUrl
                                );

                            };

                    }


                    /* =================================================
                       SHOW SUCCESS CARD
                    ================================================= */

                    if (successSection) {

                        successSection.hidden =
                            false;


                        successSection.style.display =
                            "block";


                        successSection.scrollIntoView({
                            behavior:
                                "smooth",

                            block:
                                "start"
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


                    let message =
                        "We could not complete your registration. Please try again.";


                    if (
                        error &&
                        typeof error.message ===
                            "string" &&
                        error.message.indexOf(
                            "PHOTO_UPLOAD_FAILED:"
                        ) === 0
                    ) {

                        const actualError =
                            error.message
                                .replace("PHOTO_UPLOAD_FAILED:", "")
                                .trim();

                        message =
                            "Your photograph could not be uploaded.\n\n" +
                            "The image was processed successfully, but Supabase rejected the upload.\n\n" +
                            "Server response: " +
                            actualError +
                            "\n\n" +
                            "Please check the member-photos Storage bucket policy.";

                    }


                    alert(
                        message
                    );

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
