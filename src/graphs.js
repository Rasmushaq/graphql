/madere/div-01/graphql



async function getXp() {
    console.log("getUsername called")
    // query to get username, graphql
     const query = `
    // query {
    //     user {
    //         login
    //         id
    //     }
    // }
    // `

    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + sessionStorage.getItem('token')
        },
        body: JSON.stringify({ query })
    }

    const respons = await fetch('https://01.gritlab.ax/api/graphql-engine/v1/graphql', requestOptions)
    console.log(respons)
    const data = await respons.json()
    console.log(data)

    return data
}




// query gatherTotalXp {
//     xp : transaction_aggregate(
//     where: {
//       userId: {_eq: 1429}
//       type: {_eq: "xp"}
//       eventId: {_eq: 20}
//     }
//   ) {aggregate {sum {amount}}}
//     xpJs : transaction_aggregate(
//     where: {
//       userId: {_eq: 1429}
//       type: {_eq: "xp"}
//       eventId: {_eq: 37}
//     }
//   ) {aggregate {sum {amount}}}
//     xpGo : transaction_aggregate(
//     where: {
//       userId: {_eq: 1429}
//       type: {_eq: "xp"}
//       eventId: {_eq: 10}
//     }
//   ) {aggregate {sum {amount}}}
//   }


// query asd {
//     user: user_by_pk(id: 1402) {
//       login
//       firstName
//       lastName
//       auditRatio
//       totalUp
//       totalDown
//     }
//   }