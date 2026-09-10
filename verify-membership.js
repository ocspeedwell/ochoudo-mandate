/* =========================================================
   OCHOUdo MANDATE GROUP
   MEMBERSHIP VERIFICATION
   ========================================================= */

(function () {

    "use strict";


    /* =========================================================
       SUPABASE
    ========================================================= */

    const SUPABASE_URL =
        "https://yopqftofkvwrpyyluffw.supabase.co";

    const SUPABASE_ANON_KEY =
        "sb_publishable_k3whUGyuDbdQU6GA6egeuQ_k-g-nFoL";

    const { createClient } =
        window.supabase;

    const db =
        createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );


    /* =========================================================
       ELEMENTS
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


    function setText(id, value) {

        const element =
            document.getElementById(id);

        if (!element) return;

        element.textContent =
            upper(value);

    }


    /* =========================================================
       MESSAGE
    ========================================================= */

    function showMessage(
        text,
        type
    ) {

        if (!message) return;

        message.textContent =
            text;

        message.className =
            "verification-message show " +
            type;

    }


    function clearMessage() {

        if (!message) return;

        message.textContent =
            "";

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
            new Date(
                value + "T00:00:00"
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

    function resetCard() {

        if (result) {

            result.hidden = true;

            result.classList.remove(
                "show"
            );

        }


        setText(
            "successMemberId",
            ""
        );

        setText(
            "successMemberName",
            ""
        );

        setText(
            "successMemberGender",
            ""
        );

        setText(
            "successRegistrationDate",
            ""
        );

        setText(
            "successMemberLga",
            ""
        );

        setText(
            "successMemberWard",
            ""
        );

        setText(
            "successMemberPollingUnit",
            ""
        );

        setText(
            "successMembershipStatus",
            ""
        );


        const photo =
            document.getElementById(
                "successMemberPhoto"
            );


        if (photo) {

            photo.removeAttribute(
                "src"
            );

        }

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
                "successMemberPhoto"
            );


        if (!photo) return;


        photo.removeAttribute(
            "src"
        );


        try {

            const {
                data,
                error
            } =
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

                return;

            }


            if (
                !data ||
                !data.photo_url
            ) {

                console.warn(
                    "No member photo returned."
                );

                return;

            }


            photo.onload =
                function () {

                    console.log(
                        "Member photo loaded."
                    );

                };


            photo.onerror =
                function () {

                    console.error(
                        "Member photo could not be displayed."
                    );

                    photo.removeAttribute(
                        "src"
                    );

                };


            photo.src =
                data.photo_url;

        }

        catch (error) {

            console.error(
                "Unable to load member photo:",
                error
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


        const {
            data,
            error
        } =
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

    async function displayMember(
        member
    ) {

        setText(
            "successMemberId",
            member.member_id
        );


        setText(
            "successMemberName",
            member.full_name
        );


        setText(
            "successMemberGender",
            member.gender
        );


        setText(
            "successMemberLga",
            member.lga
        );


        setText(
            "successMemberWard",
            member.ward
        );


        setText(
            "successMemberPollingUnit",
            member.polling_unit
        );


        setText(
            "successMembershipStatus",
            member.membership_status ||
            "PENDING"
        );


        const dateElement =
            document.getElementById(
                "successRegistrationDate"
            );


        if (dateElement) {

            dateElement.textContent =
                formatDate(
                    member.registration_date
                );

        }


        if (result) {

            result.hidden = false;

            result.classList.add(
                "show"
            );

        }


        /*
         * Load the member photograph
         * after the card has been displayed.
         */

        await loadMemberPhoto(
            phoneInput.value,
            member.member_id
        );


        if (result) {

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

                resetCard();


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


                    await displayMember(
                        member
                    );


                    showMessage(
                        "Membership verified successfully.",
                        "success"
                    );

                }

                catch (error) {

                    console.error(
                        error
                    );


                    showMessage(
                        error.message ||
                        "Verification failed. Please try again.",
                        "error"
                    );

                }

                finally {

                    button.disabled =
                        false;

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

                resetCard();

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

    resetCard();


})();
