import IAPOBackground from "../assets/IAPOBackground.jpg";
import { RegularLink } from "../comp/linking";
import { useEffect, useState } from "react";
import { getReq, postReq } from "../comp/callRequests.js";

function Home() {
  // const [apiData, setApiData] = useState(null);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const data = await getReq("/get-data");
  //       setApiData(data);
  //       console.log("GET response:", data);
  //     } catch (error) {
  //       console.error("GET request failed:", error);
  //     }
  //   };

  //   fetchData();
  // }, []);

  // const handlePostRequest = async () => {
  //   try {
  //     const response = await postReq("/post-data", {
  //       name: "Test Hello",
  //       value: 10,
  //     });

  //     console.log("POST response:", response);
  //     setApiData(response);
  //   } catch (error) {
  //     console.error("POST request failed:", error);
  //   }
  // };

  return (
    <div
      className="background"
      style={{ backgroundImage: `url(${IAPOBackground})` }}
    >
      <div className="headingContainer">
        <p className="headingTitle">The Intelligent Academic Path Optimizer</p>
      </div>
      <div className="buttonContainer">
        <RegularLink href="/signup" className="button">
          Sign Up
        </RegularLink>
        <RegularLink href="/login" className="button">
          Log In
        </RegularLink>
      </div>

      {/* <button className="button" onClick={handlePostRequest}>
        Test POST
      </button> */}

      {/* {apiData && (
        <div>
          <p>API Response:</p>
          <pre>{JSON.stringify(apiData, null, 2)}</pre>
        </div>
      )} */}
    </div>
  );
}

export default Home;
