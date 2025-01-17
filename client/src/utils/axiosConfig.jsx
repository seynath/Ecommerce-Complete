export const base_url = "http://104.155.157.7:5001/api/";
// export const base_url = import.meta.env.VITE_BASE_URL;
// export const base_url = process.env.VITE_BASE_URL;


const getTokenFromLocalStorage = localStorage.getItem("user")
  ? JSON.parse(localStorage.getItem("user"))
  : null;

export const config = {
  headers: {
    Authorization: `Bearer ${
      getTokenFromLocalStorage !== null ? getTokenFromLocalStorage.token : ""
    }`,
    Accept: "application/json",
  },
};
