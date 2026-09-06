const groups = {
  "Owerri Zone": [
    ["Owerri Municipal","https://chat.whatsapp.com/FPKsQOW3Ja91NPOlk7ANRU"],
    ["Owerri North","https://chat.whatsapp.com/ElPpaTeC42BHeNoMjGhWx7"],
    ["Owerri West","https://chat.whatsapp.com/FaUfsJvtRfaCe9MaqYxjVd"],
    ["Mbaitoli","https://chat.whatsapp.com/Hgh0Z1zagiSJ9nBRcouIwN"],
    ["Ikeduru","https://chat.whatsapp.com/GmwMcMDh3vRFFEf6HIDbt1"],
    ["Ngor Okpala","https://chat.whatsapp.com/IruhSXQSYt5IWQII6sYvh8"],
    ["Aboh Mbaise","https://chat.whatsapp.com/LIJ6rPrDr5y3A42ZqpMJs5"],
    ["Ahiazu Mbaise","https://chat.whatsapp.com/G9IcXJjbOWvGA8lMnfPfaY"],
    ["Ezinihitte Mbaise","https://chat.whatsapp.com/IHqyB15TaId3VvtoFsjaHO"]
  ],
  "Orlu Zone": [
    ["Orlu","https://chat.whatsapp.com/IPgJwDmvNAz2ehHpKIgsJ3"],
    ["Orlu East","https://chat.whatsapp.com/CPVAT57iI2kC0d6y3V1oU0"],
    ["Orlu West","https://chat.whatsapp.com/HZRQjTn1XNbCLMBg3g58UC"],
    ["Oru East","https://chat.whatsapp.com/Dl5o4XP9Zb11Vz7mGmzimK"],
    ["Oru West","https://chat.whatsapp.com/IWIOPu9om51D49kk2C4DLy"],
    ["Ideato North","https://chat.whatsapp.com/LEzDYMsCAzxFFLQ94PKZZb"],
    ["Ideato South","https://chat.whatsapp.com/HU145ZKbzpmDuqEGb6T39W"],
    ["Njaba","https://chat.whatsapp.com/GRmXDsGgOjfHJNzqQJwhCu"],
    ["Nkwerre","https://chat.whatsapp.com/KPad30ipb8F4vl7LEJk5Ld"],
    ["Nwangele","https://chat.whatsapp.com/IsU7Xzm4JWn1YZ0JP8tGWj"],
    ["Isu","https://chat.whatsapp.com/E8USOKKOfVx8YR73CEXEJo"],
    ["Oguta","https://chat.whatsapp.com/HrLaetq5qCR16t8FUWu56Z"],
    ["Ohaji/Egbema","https://chat.whatsapp.com/KaDyu9OesMl2laMhG8q8Vc"]
  ],
  "Okigwe Zone": [
    ["Okigwe","https://chat.whatsapp.com/BVbuY466t3j7R11GKciXeA"],
    ["Onuimo","https://chat.whatsapp.com/DHFJOEcVrygCv2h7pgvGd9"],
    ["Isiala Mbano","https://chat.whatsapp.com/CCQtBsv2rOY1UZ03l93NIl"],
    ["Ehime Mbano","https://chat.whatsapp.com/LxXHoK2gxon21NYn600uNq"],
    ["Ihitte/Uboma","https://chat.whatsapp.com/DdpBEjQs5ZDE15BJWJeyqM"],
    ["Obowo","https://chat.whatsapp.com/Ihe6NS3a0lpFW5YFtVzKvo"]
  ],
  "Cities in Nigeria": [
    ["Lagos","https://chat.whatsapp.com/KAsAsYac7wbAzXgbmVw55H"],
    ["Abuja",null],["Port Harcourt",null],["Enugu",null],
    ["Aba",null],["Onitsha",null],["Benin City",null],["Ibadan",null]
  ],
  "Global Diaspora": [
    ["United Kingdom",null],["United States",null],["Canada",null],
    ["Germany",null],["Ireland",null],["Italy",null],["France",null],
    ["South Africa",null],["Ghana",null],["United Arab Emirates",null],
    ["Australia",null],["Rest of the World",null]
  ]
};

const results = document.getElementById("communityResults");

function renderGroups(filter=""){
  results.innerHTML="";
  const query=filter.toLowerCase().trim();

  Object.entries(groups).forEach(([zone,items])=>{
    const filtered=items.filter(([name])=>name.toLowerCase().includes(query)||zone.toLowerCase().includes(query));
    if(!filtered.length)return;

    const section=document.createElement("div");
    section.className="community-zone";
    section.innerHTML=`<h3 class="zone-title">${zone}</h3><div class="community-grid"></div>`;
    const grid=section.querySelector(".community-grid");

    filtered.forEach(([name,link])=>{
      const card=document.createElement("article");
      card.className="community-card";
      card.innerHTML=`
        <h3>${name}</h3>
        <p>Ochoudo Mandate Group Community</p>
        ${link
          ? `<a class="join-btn" href="${link}" target="_blank" rel="noopener">JOIN WHATSAPP GROUP</a>`
          : `<span class="coming-soon">COMMUNITY FORMING</span>`}
      `;
      grid.appendChild(card);
    });
    results.appendChild(section);
  });

  if(!results.innerHTML){
    results.innerHTML='<p>No community found. Please try another location.</p>';
  }
}

renderGroups();

document.getElementById("communitySearch").addEventListener("input",e=>renderGroups(e.target.value));

const menuToggle=document.getElementById("menuToggle");
const navMenu=document.getElementById("navMenu");
menuToggle.addEventListener("click",()=>navMenu.classList.toggle("open"));
document.querySelectorAll(".nav a").forEach(link=>link.addEventListener("click",()=>navMenu.classList.remove("open")));