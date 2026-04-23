const bcrypt = require("bcrypt");
const { db } = require("../../config/db");
const redis = require("../../config/redis");
const ApiError = require("../../utils/apiError");

async function getProfile(userId) {
  const user = await db("users")
    .where({ id: userId })
    .select("id", "name", "email", "phone", "role", "email_verified", "is_active", "created_at")
    .first();

  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  return user;
}

async function updateProfile(userId, payload) {
  if (Object.keys(payload).length === 0) {
    return getProfile(userId);
  }

  const updates = {
    ...payload,
    updated_at: db.fn.now()
  };

  await db("users").where({ id: userId }).update(updates);
  return getProfile(userId);
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await db("users").where({ id: userId }).select("password_hash").first();
  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  const isValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValid) {
    throw new ApiError(400, "Incorrect current password", "INVALID_PASSWORD");
  }

  const password_hash = await bcrypt.hash(newPassword, 12);

  await db("users").where({ id: userId }).update({
    password_hash,
    updated_at: db.fn.now()
  });

  if (redis) {
    await redis.del(`refresh:${userId}`);
  }
}

async function getAddresses(userId) {
  return db("addresses")
    .where({ user_id: userId })
    .orderBy([
      { column: "is_default", order: "desc" },
      { column: "created_at", order: "desc" }
    ]);
}

async function addAddress(userId, payload) {
  return db.transaction(async (trx) => {
    if (payload.is_default) {
      await trx("addresses").where({ user_id: userId }).update({ is_default: false });
    }

    const [address] = await trx("addresses")
      .insert({
        user_id: userId,
        ...payload
      })
      .returning("*");

    return address;
  });
}

async function updateAddress(userId, addressId, payload) {
  return db.transaction(async (trx) => {
    const address = await trx("addresses").where({ id: addressId, user_id: userId }).first();
    if (!address) {
      throw new ApiError(403, "Address not found or unauthorized", "FORBIDDEN");
    }

    if (payload.is_default) {
      await trx("addresses").where({ user_id: userId }).update({ is_default: false });
    }

    const updates = { ...payload, updated_at: trx.fn.now() };

    const [updated] = await trx("addresses")
      .where({ id: addressId })
      .update(updates)
      .returning("*");

    return updated;
  });
}

async function deleteAddress(userId, addressId) {
  return db.transaction(async (trx) => {
    const address = await trx("addresses").where({ id: addressId, user_id: userId }).first();
    if (!address) {
      throw new ApiError(403, "Address not found or unauthorized", "FORBIDDEN");
    }

    try {
      await trx("addresses").where({ id: addressId }).del();
    } catch (err) {
      // Postgres foreign key violation code
      if (err.code === "23503" || err.code === "ER_ROW_IS_REFERENCED_2") {
        throw new ApiError(422, "Cannot delete address because it is referenced by an order", "ADDRESS_REFERENCED");
      }
      throw err;
    }
  });
}

async function listUsers(query) {
  const { page, limit, role } = query;
  const offset = (page - 1) * limit;

  const dbQuery = db("users");
  if (role) {
    dbQuery.where({ role });
  }

  const totalRow = await dbQuery.clone().count({ count: "*" }).first();
  const total = Number(totalRow.count || 0);

  const users = await dbQuery
    .clone()
    .select("id", "name", "email", "phone", "role", "email_verified", "is_active", "created_at")
    .orderBy("created_at", "desc")
    .limit(limit)
    .offset(offset);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      pages: total === 0 ? 0 : Math.ceil(total / limit)
    }
  };
}

async function getUserDetails(userId) {
  const user = await db("users")
    .where({ id: userId })
    .select("id", "name", "email", "phone", "role", "email_verified", "is_active", "created_at")
    .first();

  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  const orderCountRow = await db("orders").where({ user_id: userId }).count({ count: "*" }).first();
  user.order_count = Number(orderCountRow.count || 0);

  return user;
}

async function updateUserStatus(userId, isActive) {
  const [user] = await db("users")
    .where({ id: userId })
    .update({
      is_active: isActive,
      updated_at: db.fn.now()
    })
    .returning(["id", "name", "email", "is_active", "role"]);

  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  return user;
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  listUsers,
  getUserDetails,
  updateUserStatus
};
