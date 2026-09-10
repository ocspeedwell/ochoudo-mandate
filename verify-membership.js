/* =========================================================
   OCHOUdo MANDATE GROUP
   MEMBERSHIP VERIFICATION
   ========================================================= */

(function () {
    "use strict";

    const SUPABASE_URL =
        "https://yopqftofkvwrpyyluffw.supabase.co";

    const SUPABASE_ANON_KEY =
        "sb_publishable_k3whUGyuDbdQU6GA6egeuQ_k-g-nFoL";

    const { createClient } = window.supabase;

    const db = createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );


    /* =========================================================
       ELEMENTS
       ========================================================= */

    const form =
        document.getElementById("verificationForm");

    const phoneInput =
        document.getElementById("verifyPhone");

    const memberIdInput =
        document.getElementById("verifyMemberId");

    const button =
        document.getElementById(
            "verifyMembershipButton"
        );

    const message =
        document.getElementById(
            "verificationMessage"
        );

    const result =
        document.getElementById(
            "registrationSuccess"
        );

    const printButton =
        document.getElementById(
            "printVerifiedCard"
        );

    const anotherButton =
        document.getElementById(
            "verifyAnother"
        );


    /* =========================================================
       NORMALIZE NIGERIAN PHONE NUMBER
       ========================================================= */

    function normalizePhone(phone) {

        const digits =
            String(phone || "")
                .replace(/\D/g, "");

        if (/^0\d{10}$/.test(digits)) {
            return "234" + digits.substring(1);
        }

        if (/^234\d{10}$/.test(digits)) {
            return digits;
        }

        return null;
    }


    /* =========================================================
       TEXT HELPERS
       ========================================================= */

    function cleanText(value) {

        return String(value ?? "").trim();
    }


    function upper(value) {

        const text =
            cleanText(value);

        return text
            ? text.toUpperCase()
            : "NOT PROVIDED";
    }


    function setText(id, value) {

        const element =
            document.getElementById(id);

        if (!element) return;

        element.textContent =
            upper(value);
    }


    function showMessage(text, type) {

        if (!message) return;

        message.textContent = text;

        message.className =
            "verification-message show " +
            type;
    }


    function clearMessage() {

        if (!message) return;

        message.textContent = "";

        message.className =
            "verification-message";
    }


    /* =========================================================
       DATE FORMAT
       ========================================================= */

    function formatDate(value) {

        if (!value) {
            return "NOT PROVIDED";
        }

        const date =
            new Date(value + "T00:00:00");

        if (Number.isNaN(date.getTime())) {
            return upper(value);
        }

        return date
            .toLocaleDateString(
                "en-GB",
                {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                }
            )
            .toUpperCase();
    }


    /* =========================================================
       PHOTO PLACEHOLDER
       ========================================================= */

    function setPhotoPlaceholder(text) {

        const photo =
            document.getElementById(
                "verifiedMemberPhoto"
            );

        const placeholder =
            document.getElementById(
                "verificationPhotoPlaceholder"
            );

        if (photo) {
            photo.removeAttribute("src");
            photo.style.display = "none";
        }

        if (placeholder) {
            placeholder.innerHTML = text;
            placeholder.style.display = "flex";
        }
    }


    /* =========================================================
       RESET CARD
       ========================================================= */

    function resetVerifiedCard() {

        if (result) {
            result.hidden = true;
        }

        setText(
            "verifiedMemberName",
            ""
        );

        setText(
            "verifiedMemberId",
            ""
        );

        setText(
            "verifiedMemberGender",
            ""
        );

        setText(
            "verifiedMemberLga",
            ""
        );

        setText(
            "verifiedMemberWard",
            ""
        );

        setText(
            "verifiedMemberPollingUnit",
            ""
        );

        setText(
            "verifiedMembershipStatus",
            ""
        );

        const dateElement =
            document.getElementById(
                "verifiedRegistrationDate"
            );

        if (dateElement) {
            dateElement.textContent =
                "NOT PROVIDED";
        }

        setPhotoPlaceholder(
            "MEMBER PHOTO<br>NOT AVAILABLE"
        );
    }


    /* =========================================================
       LOAD MEMBER PHOTO

       IMPORTANT:
       The member photo is private. This page therefore asks
       the Supabase Edge Function "get-member-photo" for a
       short-lived signed URL after membership verification.

       The service-role key must NEVER be placed in this file.
       ========================================================= */

    async function loadMemberPhoto(
        phone,
        memberId
    ) {

        const photo =
            document.getElementById(
                "verifiedMemberPhoto"
            );

        const placeholder =
            document.getElementById(
                "verificationPhotoPlaceholder"
            );

        if (!photo || !placeholder) {
            return;
        }

        setPhotoPlaceholder(
            "LOADING MEMBER PHOTO..."
        );

        try {

            const { data, error } =
                await db.functions.invoke(
                    "get-member-photo",
                    {
                        body: {
                            phone: phone,
                            member_id: memberId
                        }
                    }
                );

            if (error) {

                console.error(
                    "Photo function error:",
                    error
                );

                throw error;
            }

            if (
                !data ||
                !data.photo_url
            ) {

                setPhotoPlaceholder(
                    "MEMBER PHOTO<br>NOT AVAILABLE"
                );

                return;
            }


            photo.onload =
                function () {

                    photo.style.display =
                        "block";

                    placeholder.style.display =
                        "none";
                };


            photo.onerror =
                function () {

                    setPhotoPlaceholder(
                        "MEMBER PHOTO<br>NOT AVAILABLE"
                    );
                };


            photo.src =
                data.photo_url;

        } catch (error) {

            console.error(
                "Unable to load member photo:",
                error
            );

            setPhotoPlaceholder(
                "MEMBER PHOTO<br>NOT AVAILABLE"
            );
        }
    }


    /* =========================================================
       VERIFY MEMBERSHIP
       ========================================================= */

    async function verifyMembership(
        phone,
        memberId
    ) {

        const normalizedPhone =
            normalizePhone(phone);

        if (!normalizedPhone) {

            throw new Error(
                "Please enter a valid Nigerian phone number."
            );
        }


        const cleanMemberId =
            cleanText(memberId)
                .toUpperCase();

        if (!cleanMemberId) {

            throw new Error(
                "Please enter your Membership ID."
            );
        }


        const { data, error } =
            await db.rpc(
                "verify_membership",
                {
                    p_phone:
                        normalizedPhone,

                    p_member_id:
                        cleanMemberId
                }
            );


        if (error) {

            console.error(
                "Membership verification error:",
                error
            );

            throw new Error(
                "We could not complete the verification right now. Please try again."
            );
        }


        if (
            !data ||
            data.length === 0
        ) {

            throw new Error(
                "Membership record not found. Please check your phone number and Membership ID."
            );
        }


        return data[0];
    }


    /* =========================================================
       DISPLAY VERIFIED MEMBER
       ========================================================= */

    function displayMember(member) {

        setText(
            "verifiedMemberName",
            member.full_name
        );

        setText(
            "verifiedMemberId",
            member.member_id
        );

        setText(
            "verifiedMemberGender",
            member.gender
        );

        setText(
            "verifiedMemberLga",
            member.lga
        );

        setText(
            "verifiedMemberWard",
            member.ward
        );

        setText(
            "verifiedMemberPollingUnit",
            member.polling_unit
        );


        const dateElement =
            document.getElementById(
                "verifiedRegistrationDate"
            );

        if (dateElement) {

            dateElement.textContent =
                formatDate(
                    member.registration_date
                );
        }


        setText(
            "verifiedMembershipStatus",
            member.membership_status ||
            "PENDING"
        );


        /*
         * Request the private photograph only
         * after the membership record has been
         * successfully verified.
         */

        loadMemberPhoto(
            phoneInput.value,
            member.member_id
        );


        if (result) {

            result.hidden = false;

            result.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }


    /* =========================================================
       FORM SUBMISSION
       ========================================================= */

    if (form) {

        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                clearMessage();

                resetVerifiedCard();

                button.disabled = true;

                button.textContent =
                    "VERIFYING...";


                try {

                    const member =
                        await verifyMembership(
                            phoneInput.value,
                            memberIdInput.value
                        );


                    displayMember(member);


                    showMessage(
                        "Membership verified successfully.",
                        "success"
                    );

                } catch (error) {

                    console.error(error);

                    showMessage(
                        error.message ||
                        "Verification failed. Please try again.",
                        "error"
                    );

                } finally {

                    button.disabled = false;

                    button.textContent =
                        "VERIFY MEMBERSHIP";
                }
            }
        );
    }


    /* =========================================================
       FORCE MEMBERSHIP ID TO UPPERCASE
       ========================================================= */

    if (memberIdInput) {

        memberIdInput.addEventListener(
            "input",
            function () {

                this.value =
                    this.value.toUpperCase();
            }
        );
    }


    /* =========================================================
       PRINT MEMBERSHIP CARD
       ========================================================= */

    if (printButton) {

        printButton.addEventListener(
            "click",
            function () {

                window.print();
            }
        );
    }


    /* =========================================================
       VERIFY ANOTHER MEMBER
       ========================================================= */

    if (anotherButton) {

        anotherButton.addEventListener(
            "click",
            function () {

                resetVerifiedCard();

                clearMessage();

                if (form) {
                    form.reset();
                }

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

                if (phoneInput) {
                    phoneInput.focus();
                }
            }
        );
    }


    /* =========================================================
       INITIAL STATE
       ========================================================= */

    resetVerifiedCard();

})();
