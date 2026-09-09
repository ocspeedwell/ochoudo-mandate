document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("membershipForm");

    form.addEventListener("submit", function (event) {

        event.preventDefault();

        alert(
            "Thank you for registering with the Ochoudo Mandate Group. Your membership registration has been received."
        );

    });

});
