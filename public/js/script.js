const userContainer = document.getElementById("users-container");
const fetchUsers = async ()=>{
    try{
        //fetch data from the server
        const response = await fetch("/people");
        if(!response.ok){
            throw new Error("failed to get users");
        }

        //parse the json
        const users = await response.json();

        //format the data to html
        userContainer.innerHTML = "";

        users.forEach(user => {
            const userDiv = document.createElement("div");
            userDiv.className = "user";
            userDiv.innerHTML = `${user.firstname} ${user.lastname} Email:${user.email}`;
            userContainer.appendChild(userDiv);
        });

    }catch(err){
        console.error("Error: ". error);
        userContainer.innerHTML = "<p = style = 'color:red'> !failed to get users! </p>"
    }
}

fetchUsers();