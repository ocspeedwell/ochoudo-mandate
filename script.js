const communities = [
  ["Owerri Municipal", "Imo State, Nigeria", "https://chat.whatsapp.com/FPKsQOW3Ja91NPOlk7ANRU"],
  ["Owerri North", "Imo State, Nigeria", "https://chat.whatsapp.com/ElPpaTeC42BHeNoMjGhWx7"],
  ["Owerri West", "Imo State, Nigeria", "https://chat.whatsapp.com/FaUfsJvtRfaCe9MaqYxjVd"],
  ["Mbaitoli", "Imo State, Nigeria", "https://chat.whatsapp.com/Hgh0Z1zagiSJ9nBRcouIwN"],
  ["Ikeduru", "Imo State, Nigeria", "https://chat.whatsapp.com/GmwMcMDh3vRFFEf6HIDbt1"],
  ["Ngor Okpala", "Imo State, Nigeria", "https://chat.whatsapp.com/IruhSXQSYt5IWQII6sYvh8"],
  ["Aboh Mbaise", "Imo State, Nigeria", "https://chat.whatsapp.com/LIJ6rPrDr5y3A42ZqpMJs5"],
  ["Ahiazu Mbaise", "Imo State, Nigeria", "https://chat.whatsapp.com/G9IcXJjbOWvGA8lMnfPfaY"],
  ["Ezinihitte Mbaise", "Imo State, Nigeria", "https://chat.whatsapp.com/IHqyB15TaId3VvtoFsjaHO"],
  ["Obowo", "Imo State, Nigeria", "https://chat.whatsapp.com/IPgJwDmvNAz2ehHpKIgsJ3"],
  ["Okigwe", "Imo State, Nigeria", "https://chat.whatsapp.com/CPVAT57iI2kC0d6y3V1oU0"],
  ["Onuimo", "Imo State, Nigeria", "https://chat.whatsapp.com/HZRQjTn1XNbCLMBg3g58UC"],
  ["Isiala Mbano", "Imo State, Nigeria", "https://chat.whatsapp.com/Dl5o4XP9Zb11Vz7mGmzimK"],
  ["Ehime Mbano", "Imo State, Nigeria", "https://chat.whatsapp.com/IWIOPu9om51D49kk2C4DLy"],
  ["Ihitte Uboma", "Imo State, Nigeria", "https://chat.whatsapp.com/LEzDYMsCAzxFFLQ94PKZZb"],
  ["Ideato North", "Imo State, Nigeria", "https://chat.whatsapp.com/HU145ZKbzpmDuqEGb6T39W"],
  ["Ideato South", "Imo State, Nigeria", "https://chat.whatsapp.com/GRmXDsGgOjfHJNzqQJwhCu"],
  ["Orlu", "Imo State, Nigeria", "https://chat.whatsapp.com/KPad30ipb8F4vl7LEJk5Ld"],
  ["Orlu East", "Imo State, Nigeria", "https://chat.whatsapp.com/IsU7Xzm4JWn1YZ0JP8tGWj"],
  ["Orsu", "Imo State, Nigeria", "https://chat.whatsapp.com/E8USOKKOfVx8YR73CEXEJo"],
  ["Oru East", "Imo State, Nigeria", "https://chat.whatsapp.com/HrLaetq5qCR16t8FUWu56Z"],
  ["Oru West", "Imo State, Nigeria", "https://chat.whatsapp.com/KaDyu9OesMl2laMhG8q8Vc"],
  ["Oguta", "Imo State, Nigeria", "https://chat.whatsapp.com/BVbuY466t3j7R11GKciXeA"],
  ["Ohaji Egbema", "Imo State, Nigeria", "https://chat.whatsapp.com/DHFJOEcVrygCv2h7pgvGd9"],
  ["Njaba", "Imo State, Nigeria", "https://chat.whatsapp.com/CCQtBsv2rOY1UZ03l93NIl"],
  ["Nwangele", "Imo State, Nigeria", "https://chat.whatsapp.com/LxXHoK2gxon21NYn600uNq"],
  ["Isu", "Imo State, Nigeria", "https://chat.whatsapp.com/DdpBEjQs5ZDE15BJWJeyqM"],

  ["Abuja", "Federal Capital Territory, Nigeria", "https://chat.whatsapp.com/Ihe6NS3a0lpFW5YFtVzKvo"],
  ["Lagos", "Lagos State, Nigeria", "https://chat.whatsapp.com/KAsAsYac7wbAzXgbmVw55H"],

  ["Port Harcourt", "Rivers State, Nigeria", ""],
  ["London", "United Kingdom", ""],
  ["Houston", "Texas, USA", ""],
  ["Atlanta", "Georgia, USA", ""],
  ["Toronto", "Ontario, Canada", ""],
  ["Dublin", "Ireland", ""],
  ["Germany", "Europe", ""],
  ["South Africa", "Africa", ""]
];


const grid = document.getElementById("grid");


function renderCommunities(list) {

  grid.innerHTML = "";

  list.forEach(function(community) {

    const name = community[0];
    const location = community[1];
    const link = community[2];

    const card = document.createElement("div");

    card.className = "card";

    if (link) {

      card.innerHTML = `
        <div>
          <h3>${name}</h3>
          <small>${location}</small>
        </div>

        <a href="${link}" target="_blank">
          Join Group
        </a>
      `;

    } else {

      card.classList.add("pending");

      card.innerHTML = `
        <div>
          <h3>${name}</h3>
          <small>${location}</small>
        </div>

        <span>Coming Soon</span>
      `;

    }

    grid.appendChild(card);

  });

}


renderCommunities(communities);


const search = document.getElementById("search");

if (search) {

  search.addEventListener("input", function() {

    const searchTerm = this.value.toLowerCase();

    const filtered = communities.filter(function(community) {

      return (
        community[0].toLowerCase().includes(searchTerm) ||
        community[1].toLowerCase().includes(searchTerm)
      );

    });

    renderCommunities(filtered);

  });

}


const menuButton = document.querySelector(".menu");
const nav = document.querySelector("nav");

if (menuButton && nav) {

  menuButton.addEventListener("click", function() {

    nav.classList.toggle("open");

  });

}
