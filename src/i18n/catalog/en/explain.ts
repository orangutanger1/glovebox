import type { Fragment } from "../types";

/**
 * Service explainers: the card that says what a service is, why it matters,
 * and whether an owner can do it themselves.
 *
 * Written for someone who doesn't know cars. Rules for every language:
 * - No numbers in the copy. The interval on the card comes from the owner's own
 *   settings ("Your schedule"), so a sentence saying "every 5,000" would
 *   contradict it in every metric market and for every owner who changed it.
 * - No torque figures, fluid grades or part numbers. The footer points to the
 *   owner's manual for those.
 * - No fear words. Say plainly what skipping it costs.
 * - `explain.Registration.*` and `explain.Inspection.*` follow the local
 *   document the way `service.Registration` and `service.Inspection` do (road
 *   tax and the MOT in the UK, Kfz-Steuer and the HU in Germany, 車検 in Japan),
 *   not the American one.
 */
export const explain: Fragment = {
  "explain.close": "Close",
  "explain.open": "What's this?",
  "explain.schedule": "Your schedule",
  "explain.what": "What it is",
  "explain.why": "Why it matters",
  "explain.diy": "Do it yourself?",
  "explain.difficulty.easy": "Easy DIY",
  "explain.difficulty.doable": "Doable DIY",
  "explain.difficulty.shop": "Shop job",
  "explain.every": "Every {interval}",
  "explain.never": "Not logged yet",
  "explain.last": "Last done {date}",
  "explain.last.odometer": "Last done {date} at {distance}",
  "explain.due": "Next due · {when}",
  "explain.dueAt": "Next due at {distance}",
  "explain.overdue": "Overdue",
  "explain.overdueBy": "Overdue by {distance}",
  "explain.log": "Log it",
  "explain.interval": "Change interval",
  "explain.disclaimer": "General guidance. Your owner's manual has your car's exact schedule.",

  "explain.Oil Change.what":
    "Fresh oil and a new filter. Oil keeps the engine's metal parts from grinding against each other and carries heat away.",
  "explain.Oil Change.why":
    "Old oil thickens into sludge and stops protecting. Skipping changes is the most common way engines wear out early.",
  "explain.Oil Change.diy":
    "Doable with a jack, a drain pan and a filter wrench. Most people use a quick-lube shop, which takes about half an hour.",

  "explain.Tire Rotation.what":
    "Moving each tire to a different corner of the car so they all wear evenly.",
  "explain.Tire Rotation.why":
    "The front tires wear faster. Rotating them makes a set last noticeably longer and keeps the grip even.",
  "explain.Tire Rotation.diy":
    "Possible with jack stands, but most tire shops do it quickly, often free if you bought the tires there.",

  "explain.Brake Inspection.what": "A check of the brake pads, the discs they press on, and the brake fluid.",
  "explain.Brake Inspection.why":
    "Pads are cheap. Worn-out pads grind into the discs and turn a small job into a big one. Squealing or grinding means book it now.",
  "explain.Brake Inspection.diy": "Leave it to a shop unless you've done brakes before.",

  "explain.Air Filter.what": "The filter that cleans the air going into the engine.",
  "explain.Air Filter.why":
    "A clogged filter starves the engine of air, which costs power and fuel. It matters more if you drive on dusty roads.",
  "explain.Air Filter.diy":
    "Usually a few clips and no tools, about five minutes. Shops often charge a lot for it.",

  "explain.Cabin Air Filter.what":
    "The filter for the air you breathe inside the car, usually behind the glovebox.",
  "explain.Cabin Air Filter.why":
    "A dirty one makes the vents weak and musty and lets pollen in. It doesn't affect the engine.",
  "explain.Cabin Air Filter.diy": "Usually you just empty the glovebox and unclip it, about ten minutes.",

  "explain.Wiper Blades.what": "The rubber blades that clear the windshield.",
  "explain.Wiper Blades.why":
    "Sun and cold harden the rubber. Streaks and chatter in the rain mean you can't see well.",
  "explain.Wiper Blades.diy": "They clip on. Many auto parts stores fit them for free.",

  "explain.Battery Check.what":
    "A test of how much charge the battery holds, plus a look at the terminals for corrosion.",
  "explain.Battery Check.why":
    "Batteries last a few years and often die without warning, usually on the first cold morning. A test tells you before that happens.",
  "explain.Battery Check.diy": "Many auto parts stores test batteries for free in a few minutes.",

  "explain.Coolant Flush.what": "Replacing the fluid that carries heat from the engine to the radiator.",
  "explain.Coolant Flush.why":
    "Old coolant stops protecting against corrosion inside the engine. An engine that overheats can be badly damaged.",
  "explain.Coolant Flush.diy": "Leave it to a shop. Never open the radiator cap on a hot engine.",

  "explain.Transmission Fluid.what": "The fluid that lubricates and cools the gearbox.",
  "explain.Transmission Fluid.why":
    "Worn fluid leads to rough or slipping gear changes. A transmission is one of the most expensive parts of a car to replace.",
  "explain.Transmission Fluid.diy":
    "A shop job. Some cars say the fluid is “lifetime”. Your manual says whether yours really is.",

  "explain.Spark Plugs.what": "The parts that make the spark that burns the fuel in each cylinder.",
  "explain.Spark Plugs.why":
    "Worn plugs cause rough idling, misfires and worse fuel economy. Most last a long time, so this comes up rarely.",
  "explain.Spark Plugs.diy":
    "Easy on some engines and hard on others. Watch a video for your model before deciding. Electric cars don't have them.",

  "explain.Registration.what": "The yearly renewal that keeps your car legal to drive.",
  "explain.Registration.why":
    "Driving with an expired registration can mean fines, and in some places the car can be towed.",
  "explain.Registration.diy":
    "Usually done online in a few minutes. Save the confirmation in your glovebox documents.",

  "explain.Inspection.what":
    "The official safety check (and emissions check, where required) your car needs to stay on the road.",
  "explain.Inspection.why":
    "Missing it can mean fines, and some insurers won't pay out on a car without a valid one.",
  "explain.Inspection.diy":
    "Done at a licensed test center. Fix any warning lights first, since a lit warning light can fail the test in many places.",
};
