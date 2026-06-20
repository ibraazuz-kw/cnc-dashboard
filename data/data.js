let customers = JSON.parse(
localStorage.getItem("customers")
) || [];

let projects = JSON.parse(
localStorage.getItem("projects")
) || [];

function saveCustomers(){
localStorage.setItem(
"customers",
JSON.stringify(customers)
);
}

function saveProjects(){
localStorage.setItem(
"projects",
JSON.stringify(projects)
);
}