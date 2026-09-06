const communities=[['Owerri Municipal','https://chat.whatsapp.com/FPKsQOW3Ja91NPOlk7ANRU'],['Owerri North','https://chat.whatsapp.com/ElPpaTeC42BHeNoMjGhWx7'],['Owerri West','https://chat.whatsapp.com/FaUfsJvtRfaCe9MaqYxjVd'],['Mbaitoli','https://chat.whatsapp.com/Hgh0Z1zagiSJ9nBRcouIwN'],['Ikeduru','https://chat.whatsapp.com/GmwMcMDh3vRFFEf6HIDbt1'],['Ngor Okpala','https://chat.whatsapp.com/IruhSXQSYt5IWQII6sYvh8'],['Aboh Mbaise','https://chat.whatsapp.com/LIJ6rPrDr5y3A42ZqpMJs5'],['Ahiazu Mbaise','https://chat.whatsapp.com/G9IcXJjbOWvGA8lMnfPfaY'],['Ezinihitte Mbaise','https://chat.whatsapp.com/IHqyB15TaId3VvtoFsjaHO'],['Obowo','https://chat.whatsapp.com/IPgJwDmvNAz2ehHpKIgsJ3'],['Okigwe','https://chat.whatsapp.com/CPVAT57iI2kC0d6y3V1oU0'],['Onuimo','https://chat.whatsapp.com/HZRQjTn1XNbCLMBg3g58UC'],['Isiala Mbano','https://chat.whatsapp.com/Dl5o4XP9Zb11Vz7mGmzimK'],['Ehime Mbano','https://chat.whatsapp.com/IWIOPu9om51D49kk2C4DLy'],['Ihitte Uboma','https://chat.whatsapp.com/LEzDYMsCAzxFFLQ94PKZZb'],['Ideato North','https://chat.whatsapp.com/HU145ZKbzpmDuqEGb6T39W'],['Ideato South','https://chat.whatsapp.com/GRmXDsGgOjfHJNzqQJwhCu'],['Orlu','https://chat.whatsapp.com/KPad30ipb8F4vl7LEJk5Ld'],['Orlu East','https://chat.whatsapp.com/IsU7Xzm4JWn1YZ0JP8tGWj'],['Orsu','https://chat.whatsapp.com/E8USOKKOfVx8YR73CEXEJo'],['Oru East','https://chat.whatsapp.com/HrLaetq5qCR16t8FUWu56Z'],['Oru West','https://chat.whatsapp.com/KaDyu9OesMl2laMhG8q8Vc'],['Oguta','https://chat.whatsapp.com/BVbuY466t3j7R11GKciXeA'],['Ohaji Egbema','https://chat.whatsapp.com/DHFJOEcVrygCv2h7pgvGd9'],['Njaba','https://chat.whatsapp.com/CCQtBsv2rOY1UZ03l93NIl'],['Nwangele','https://chat.whatsapp.com/LxXHoK2gxon21NYn600uNq'],['Isu','https://chat.whatsapp.com/DdpBEjQs5ZDE15BJWJeyqM'],
                   [
        name: "Abuja",
        location: "Federal Capital Territory, Nigeria",
        type: "WhatsApp Community",
        link: "https://chat.whatsapp.com/Ihe6NS3a0lpFW5YFtVzKvo",
        active: true
   ],
    [
        name: "Lagos",
        location: "Lagos State, Nigeria",
        type: "WhatsApp Community",
        link: "https://chat.whatsapp.com/KAsAsYac7wbAzXgbmVw55H",
        active: true
   ],    ['Port Harcourt'],['London'],['Houston'],['Atlanta'],['Toronto'],['Dublin'],['Germany'],['South Africa']];const grid=document.querySelector('#grid');function render(list){grid.innerHTML=list.map(([n,l])=>`<div class="card ${l?'':'pending'}"><div><h3>${n}</h3><small>${l?'WhatsApp Community':'Coming Soon'}</small></div>${l?`<a target="_blank" href="${l}">Join</a>`:'<a href="#join">Soon</a>'}</div>`).join('')}render(communities);document.querySelector('#search').oninput=e=>render(communities.filter(x=>x[0].toLowerCase().includes(e.target.value.toLowerCase())));document.querySelector('.menu').onclick=()=>document.querySelector('nav').classList.toggle('open');document.querySelector('#ndc').onclick=e=>{e.preventDefault();alert('The NDC membership registration portal link will be added here.')};

const grid = document.getElementById("grid");
const search = document.getElementById("search");

function renderCommunities(items) {

    grid.innerHTML = "";

    items.forEach(community => {

        const card = document.createElement("div");

        card.className = "community-card";

        if (community.active) {

            card.innerHTML = `
                <div class="community-icon">📍</div>

                <h3>${community.name}</h3>

                <p>${community.location}</p>

                <a 
                    href="${community.link}" 
                    target="_blank"
                    rel="noopener noreferrer"
                    class="community-btn"
                >
                    Join WhatsApp Group
                </a>
            `;

        } else {

            card.innerHTML = `
                <div class="community-icon">🌍</div>

                <h3>${community.name}</h3>

                <p>${community.location}</p>

                <span class="coming-soon">
                    Coming Soon
                </span>
            `;

        }

        grid.appendChild(card);

    });

}

renderCommunities(communities);

search.addEventListener("input", function () {

    const term = this.value.toLowerCase();

    const filtered = communities.filter(community =>
        community.name.toLowerCase().includes(term) ||
        community.location.toLowerCase().includes(term)
    );

    renderCommunities(filtered);

});
