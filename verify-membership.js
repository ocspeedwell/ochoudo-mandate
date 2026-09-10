/* =========================================================
   OCHOUdo MANDATE GROUP
   MEMBERSHIP VERIFICATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    "use strict";


    /* =========================================================
       SUPABASE
       ========================================================= */

    const SUPABASE_URL =
        "https://yopqftofkvwrpyyluffw.supabase.co";

    const SUPABASE_ANON_KEY =
        "sb_publishable_k3whUGyuDbdQU6GA6egeuQ_k-g-nFoL";


    if (!window.supabase) {

        alert(
            "Unable to load the membership verification system. Please refresh the page."
        );

        console.error(
            "Supabase JavaScript library was not loaded."
        );

        return;
    }


    const db =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );


    /* =========================================================
       PAGE ELEMENTS
       ========================================================= */

    const form =
        document.getElementById(
            "verificationForm"
        );

    const phoneInput =
        document.getElementById(
            "verifyPhone"
        );

    const memberIdInput =
        document.getElementById(
            "verifyMemberId"
        );

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
            "verifiedResult"
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
       CHECK REQUIRED ELEMENTS
       ========================================================= */

    if (
        !form ||
        !phoneInput ||
        !memberIdInput ||
        !button ||
        !message ||
        !result
    ) {

        console.error(
            "Verification page elements are missing."
        );

        alert(
            "There is a problem loading the verification form. Please refresh the page."
        );

        return;
    }


    /* =========================================================
       NORMALIZE PHONE NUMBER
       ========================================================= */

    function normalizePhone(phone) {

        const digits =
            String(phone || "")
                .replace(/\D/g, "");


        if (/^0\d{10}$/.test(digits)) {

            return (
                "234" +
                digits.substring(1)
            );
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

        return String(
            value ?? ""
        ).trim();
    }


    function upper(value) {

        const text =
            cleanText(value);


        return text
            ? text.toUpperCase()
            : "NOT PROVIDED";
    }


    function showMessage(
        text,
        type
    ) {

        message.textContent =
            text;

        message.className =
            "verification-message show " +
            type;
    }


    function clearMessage() {

        message.textContent =
            "";

        message.className =
            "verification-message";
    }


    function setText(
        id,
        value
    ) {

        const element =
            document.getElementById(id);


        if (!element) {
            return;
        }


        element.textContent =
            upper(value);
    }


    /* =========================================================
       DATE FORMAT
       ========================================================= */

    function formatDate(value) {

        if (!value) {

            return "NOT PROVIDED";
        }


        const date =
            new Date(
                value +
                "T00:00:00"
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

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
       RESET CARD
       ========================================================= */

    function resetVerifiedCard() {

        result.classList.remove(
            "show"
        );


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


        const photo =
            document.getElementById(
                "verifiedMemberPhoto"
            );


        const placeholder =
            document.getElementById(
                "verificationPhotoPlaceholder"
            );


        if (photo) {

            photo.removeAttribute(
                "src"
            );

            photo.style.display =
                "none";
        }


        if (placeholder) {

            placeholder.innerHTML =
                "MEMBER PHOTO<br>NOT AVAILABLE";

            placeholder.style.display =
                "block";
        }
    }


    /* =========================================================
       VERIFY MEMBER WITH SUPABASE RPC
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


        console.log(
            "Verifying:",
            normalizedPhone,
            cleanMemberId
        );


        const response =
            await db.rpc(
                "verify_membership",
                {
                    p_phone:
                        normalizedPhone,

                    p_member_id:
                        cleanMemberId
                }
            );


        const data =
            response.data;

        const error =
            response.error;


        if (error) {

            console.error(
                "Supabase verification error:",
                error
            );

            throw new Error(
                "We could not complete the verification right now. Please try again."
            );
        }


        console.log(
            "Verification response:",
            data
        );


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
       LOAD MEMBER PHOTO
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


        if (
            !photo ||
            !placeholder
        ) {

            return;
        }


        photo.removeAttribute(
            "src"
        );

        photo.style.display =
            "none";


        placeholder.innerHTML =
            "LOADING MEMBER PHOTO...";

        placeholder.style.display =
            "block";


        try {

            console.log(
                "Requesting member photograph..."
            );


            const response =
                await db.functions.invoke(
                    "get-member-photo",
                    {
                        body: {
                            phone:
                                phone,

                            member_id:
                                memberId
                        }
                    }
                );


            const data =
                response.data;

            const error =
                response.error;


            if (error) {

                console.error(
                    "Photo function error:",
                    error
                );

                throw error;
            }


            console.log(
                "Photo response:",
                data
            );


            if (
                !data ||
                !data.photo_url
            ) {

                placeholder.innerHTML =
                    "MEMBER PHOTO<br>NOT AVAILABLE";

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

                    photo.removeAttribute(
                        "src"
                    );

                    photo.style.display =
                        "none";

                    placeholder.innerHTML =
                        "MEMBER PHOTO<br>NOT AVAILABLE";

                    placeholder.style.display =
                        "block";
                };


            photo.src =
                data.photo_url;


        } catch (error) {

            console.error(
                "Unable to load member photo:",
                error
            );


            placeholder.innerHTML =
                "MEMBER PHOTO<br>NOT AVAILABLE";
        }
    }


    /* =========================================================
       DISPLAY MEMBER
       ========================================================= */

    function displayMember(
        member,
        phone
    ) {

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


        setText(
            "verifiedMembershipStatus",
            member.membership_status ||
            "PENDING"
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


        result.classList.add(
            "show"
        );


        result.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


        /*
         * Load photograph after the
         * membership has been verified.
         */

        loadMemberPhoto(
            phone,
            member.member_id
        );
    }


    /* =========================================================
       FORM SUBMISSION
       ========================================================= */

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            clearMessage();

            resetVerifiedCard();


            button.disabled =
                true;

            button.textContent =
                "VERIFYING...";


            try {

                const member =
                    await verifyMembership(
                        phoneInput.value,
                        memberIdInput.value
                    );


                displayMember(
                    member,
                    phoneInput.value
                );


                showMessage(
                    "Membership verified successfully.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Verification failed:",
                    error
                );


                showMessage(
                    error.message ||
                    "Verification failed. Please try again.",
                    "error"
                );


            } finally {

                button.disabled =
                    false;

                button.textContent =
                    "VERIFY MEMBERSHIP";
            }
        }
    );


    /* =========================================================
       MEMBERSHIP ID UPPERCASE
       ========================================================= */

    memberIdInput.addEventListener(
        "input",
        function () {

            this.value =
                this.value.toUpperCase();
        }
    );


    /* =========================================================
       PRINT
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

                form.reset();

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

                phoneInput.focus();
            }
        );
    }


    /* =========================================================
       READ URL PARAMETERS
       ========================================================= */

    const urlParams =
        new URLSearchParams(
            window.location.search
        );


    const urlPhone =
        urlParams.get("phone");


    const urlMemberId =
        urlParams.get("member_id");


    if (urlPhone) {

        phoneInput.value =
            urlPhone;
    }


    if (urlMemberId) {

        memberIdInput.value =
            urlMemberId.toUpperCase();
    }


    /* =========================================================
       INITIAL STATE
       ========================================================= */

    resetVerifiedCard();


    console.log(
        "OMG Membership Verification loaded successfully."
    );

});
