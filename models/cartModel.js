const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
    
    cartItems: [
        {
        product: {
            type: mongoose.Schema.ObjectId,
            ref: "Product",
            
          },
        },
    ],
})

module.exports = mongoose.model("Cart", cartSchema);
