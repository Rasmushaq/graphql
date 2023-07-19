import React, { useState } from "react";
async function getToken(credentials) {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic " +
        window.btoa(credentials.username + ":" + credentials.password),
    },
  };

  const respons = await fetch(
    "https://01.gritlab.ax/api/auth/signin",
    requestOptions
  );
  const data = await respons.json();
  sessionStorage.setItem("token", data);

  if (respons.status === 200) {
    return 1;
  } else {
    return 0;
  }
}
let uId;
async function getUsername() {
  // query to get username, graphql
  const query = `
    query {
        user {
            login
            id
            firstName
            lastName
            auditRatio
        }
    }
    `;

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + sessionStorage.getItem("token"),
    },
    body: JSON.stringify({ query }),
  };

  const respons = await fetch(
    "https://01.gritlab.ax/api/graphql-engine/v1/graphql",
    requestOptions
  );
  const data = await respons.json();
  uId = data.data.user[0].id;
  // getTheRest()

  return data;
}

async function getTheRest() {
  // query to get username, graphql
  const query = `
   query gatherTotalXp($uId: Int!) {
    user: user_by_pk(id: $uId) {
      login
      firstName
      lastName
      auditRatio
      totalUp
      totalDown
    }
    audits: transaction(order_by: {createdAt: asc}, where: {type: {_regex: "up|down"}}) {
      type
      amount
      path
      createdAt
    }
  	xp: transaction(order_by: {createdAt: asc}, where: {
      type: {_eq: "xp"}
    	eventId: {_eq: 20}
    }) {
    		createdAt
        amount
    		path
      }
  	xpJS: transaction(order_by: {createdAt: asc}, where: {
      type: {_eq: "xp"}
    	eventId: {_eq: 37}
    }) {
    		createdAt
        amount
    		path
      }
  	xpGo: transaction(order_by: {createdAt: asc}, where: {
      type: {_eq: "xp"}
    	eventId: {_in: [2,10]}
    }) {
    		createdAt
        amount
    		path
      }
    xpTotal : transaction_aggregate(
    where: {
      userId: {_eq: $uId}
      type: {_eq: "xp"}
      eventId: {_eq: 20}
    }
  ) {aggregate {sum {amount}}}
    xpJsTotal : transaction_aggregate(
    where: {
      userId: {_eq: $uId}
      type: {_eq: "xp"}
      eventId: {_eq: 37}
    }
  ) {aggregate {sum {amount}}}
    xpGoTotal : transaction_aggregate(
    where: {
      userId: {_eq: $uId}
      type: {_eq: "xp"}
      eventId: {_in: [10, 2]}
    }
  ) {aggregate {sum {amount}}}
  }`;
  const variables = { uId: uId };
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + sessionStorage.getItem("token"),
    },
    body: JSON.stringify({ query, variables }),
  };

  const respons = await fetch(
    "https://01.gritlab.ax/api/graphql-engine/v1/graphql",
    requestOptions
  );
  const data = await respons.json();

  let percent = Math.round(
    (data.data.user.totalUp /
      (data.data.user.totalUp + data.data.user.totalDown)) *
      100
  );

  let el = document.createElement("div");
  el.innerHTML += `<svg height="200" width="200" viewBox="0 0 200 200">
  <circle r="100" cx="100" cy="100" fill="white" />
  <circle r="50" cx="100" cy="100" fill="transparent"
  stroke="tomato"
  stroke-width="100"
  stroke-dasharray="calc(${percent} * 314 / 100) 314"
  transform="rotate(-90) translate(-200)" />
</svg>
<p> Audit ${percent}% Up vs Down </p>`;
  el.append(
    createLineChart(
      data.data.xp,
      data.data.xpTotal.aggregate.sum.amount,
      "all"
    ),
    createLineChart(
      data.data.xpJS,
      data.data.xpJsTotal.aggregate.sum.amount,
      "js"
    ),
    createLineChart(
      data.data.xpGo,
      data.data.xpGoTotal.aggregate.sum.amount,
      "go"
    )
  );
  document.body.appendChild(el);
  showGraph("all");
}
function showGraph(graph = "all") {
  document.getElementsByClassName("all")[0].style.display = "none";
  document.getElementsByClassName("go")[0].style.display = "none";
  document.getElementsByClassName("js")[0].style.display = "none";
  document.getElementsByClassName(graph)[0].style.display = "block";
}

function createLineChart(dataArray, xpTotal, name) {
  let yearMin = new Date(dataArray[0].createdAt);
  let yearMax = new Date(dataArray[dataArray.length - 1].createdAt);
  let intervalLength = (yearMax.getTime() - yearMin.getTime()) / 4;
  let xpMin = 0;
  let xpMax = xpTotal;
  let el = document.createElement("svg");
  el.innerHTML += `<svg version="1.2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="graph ${name}" aria-labelledby="title" role="img">
<g class="grid x-grid" id="xGrid">
  <line x1="90" x2="90" y1="5" y2="371"></line>
</g>
<g class="grid y-grid" id="yGrid">
  <line x1="90" x2="705" y1="370" y2="370"></line>
</g>`;
  let year = document.createElement("g");
  let xp = document.createElement("g");
  year.classList.add("labels", "x-labels");
  xp.classList.add("labels", "y-labels");
  for (let i = 0; i < 5; i++) {
    let temp = new Date(yearMin.getTime() + intervalLength * i);
    year.innerHTML += `<text y="400" x="${130 + 150 * i}">${
      temp.getDate() + "/" + (temp.getMonth() + 1) + "-" + temp.getFullYear()
    }</text`;
    xp.innerHTML += `<text x=80 y="${375 - 90 * i}">${
      xpMin + (xpMax / 4) * i
    }</text>`;
  }

  year.innerHTML += `<text x="400" y="440" class="label-title">Time wasted</text>`;
  el.firstChild.innerHTML +=
    `<g class="labels x-labels">` + year.innerHTML + `</g>`;
  el.firstChild.innerHTML +=
    `<g class="labels x-labels">` + xp.innerHTML + `</g>`;
  let points = mapOutData(
    xpMin,
    xpMax,
    yearMin.getTime(),
    yearMax.getTime(),
    dataArray
  );
  el.firstChild.innerHTML +=
    `<g class="first-set points data">` + points.innerHTML + `</g>`;
  return el.firstChild;
}

function mapOutData(minY, maxY, minX, maxX, arr) {
  let el = document.createElement("g");
  let lineYmin = 5;
  let lineYMax = 371;
  let lineXmin = 90;
  let lineXlen = 615;
  let lineYlen = 366;
  let totalXp = 0;
  for (let i = 0; i < arr.length; i++) {
    let xp = arr[i].amount;
    totalXp += xp;
    let yCord =
      lineYMax - ((lineYlen / 100) * ((totalXp / maxY) * 100) + lineYmin);

    let date = new Date(arr[i].createdAt).getTime() - minX;
    let xCord = (lineXlen / 100) * ((date / (maxX - minX)) * 100) + lineXmin;
    let el2 = document.createElement("g");
    el2.classList.add("bleh");
    el2.dataset.hover = arr[i].path;
    el2.innerHTML += `
    <title>Xp gain:${xp}
Date:${arr[i].createdAt}
Project:${arr[i].path}</title>
    <circle cx="${xCord}" cy="${yCord}" r="4"></circle>`;
    el.appendChild(el2);
  }
  el.classList.add("first-set", "points", "data");
  return el;
}

function logout() {
  sessionStorage.removeItem("token");
  window.location.reload();
}

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // const [rememberMe, setRememberMe] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    // perform login logic here
    const credentials = { username, password };
    let response = await getToken(credentials);
    if (response === 1) {
      let username = await getUsername();
      setUserData(username);
      getTheRest();
    } else {
      setError("You don't know your own password??????!?!!?!?!??!??!??");
      setTimeout(() => {
        setError("");
      }, 3000); // hide the error message after 5 seconds
    }
  };

  return (
    <>
      {userData ? (
        <div>
          <p>Welcome!</p>
          <p>
            Name: {userData.data.user[0].firstName}{" "}
            {userData.data.user[0].lastName}
          </p>
          <p>Username: {userData.data.user[0].login}</p>
          <p>Id: {userData.data.user[0].id}</p>
          <p>
            Audit Ratio:{" "}
            {Math.round(userData.data.user[0].auditRatio * 10) / 10}
          </p>
          <button onClick={logout}>Logout</button>
          <button onClick={() => showGraph("all")}>Projects</button>
          <button onClick={() => showGraph("go")}>Go Piscine</button>
          <button onClick={() => showGraph("js")}>Js Piscine</button>
        </div>
      ) : (
        <div>
          <h2>Login Page</h2>
          <br />
          <div className="login">
            <form id="login">
              <label>
                <b>User Name</b>
              </label>
              <input
                type="text"
                name="Uname"
                id="Uname"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <br />
              <br />
              <label>
                <b>Password</b>
              </label>
              <input
                type="password"
                name="Pass"
                id="Pass"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <br />
              <br />
              <input
                type="button"
                name="log"
                id="log"
                value="Log In Here"
                onClick={handleLogin}
              />
              <br />
              <br />
              {/* <input
                type="checkbox"
                id="check"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
              <br />
              <br /> */}
            </form>
          </div>
        </div>
      )}
      {error ? <p>{error}</p> : null}
    </>
  );
}

export default LoginPage;
