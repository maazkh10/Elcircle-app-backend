document.addEventListener(
"DOMContentLoaded",
async()=>{

try{

const customerId =
window?.ShopifyAnalytics
?.meta
?.page
?.customerId

const shop = Shopify.shop

if(!customerId) return

const url =
`/apps/elcircle-membership/loyalty/points`

const res = await fetch(
url,
{
headers:{
"ngrok-skip-browser-warning":
"true"
}
}
)

const data = await res.json()

const points =
data.points || 0

document.getElementById(
"customerPoints"
).innerHTML =
points.toLocaleString()

let tier="Bronze"
let next="500"

if(points>=500){
tier="Silver"
next="1000"
}

if(points>=1000){
tier="Gold"
next="2000"
}

if(points>=2000){
tier="Platinum"
next="3500"
}

if(points>=3500){
tier="Ruby"
next="5000"
}

if(points>=5000){
tier="Sapphire"
next="7000"
}

if(points>=7000){
tier="Emerald"
next="10000"
}

if(points>=10000){
tier="Diamond"
next="MAX"
}

document.getElementById(
"customerTier"
).innerHTML=tier

document.getElementById(
"nextUnlock"
).innerHTML=
`Next unlock ${next}`

document
.querySelectorAll(
".tier-node"
)
.forEach(x=>{

if(
x.dataset.tier===tier
){

x.classList.add(
"active-tier"
)

}

})

const collection =
document.getElementById(
"tierCollection"
)

collection.innerHTML=
`
<div class="tier-box">
${tier} Exclusive Collection
</div>
`

if(points>=3000){

document
.querySelector(
".unlock-3000"
)
.classList.add(
"unlocked"
)

}

if(points>=5000){

document
.querySelector(
".unlock-5000"
)
.classList.add(
"unlocked"
)

}

if(points>=7000){

document
.querySelector(
".unlock-7000"
)
.classList.add(
"unlocked"
)

}

}
catch(err){

console.log(err)

}

})
