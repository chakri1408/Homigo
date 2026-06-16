const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listings.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

const mongo_url = "mongodb://127.0.0.1:27017/homigo";

main()
  .then(() => {
    console.log("connection to DB succesful");
  })
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect(mongo_url);
}

const init_db = async () => {
  await Listing.deleteMany({});

  const listings = await Promise.all(
    initData.data.map(async (obj) => {
      const response = await geocodingClient
        .forwardGeocode({
          query: `${obj.location}, ${obj.country}`,
          limit: 1,
        })
        .send();

      const geometry = response.body.features[0]?.geometry || {
        type: "Point",
        coordinates: [0, 0],
      };

      return {
        ...obj,
        owner: "699adcf33868100fe0132a5e",
        geometry,
      };
    })
  );

  await Listing.insertMany(listings);
  console.log("data was initialized with geometry");
};

init_db();
