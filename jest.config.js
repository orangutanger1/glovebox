// Due dates are computed on the local calendar and pinned to a local hour, so
// the suite has to run in a known timezone or those assertions mean nothing.
// New York is deliberately not UTC: it catches the case where UTC arithmetic
// and a local read disagree about which day it is.
process.env.TZ = "America/New_York";

module.exports = { preset: "ts-jest", testEnvironment: "node" };
