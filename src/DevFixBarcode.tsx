import { useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase/firebase";

export default function DevFixBarcode() {
  useEffect(() => {
    (async () => {
      console.log("🔥 FIRESTORE RAW PRODUCTS (FULL):");

      const snap = await getDocs(
        collection(db, "users", "jinjin_paulinia", "products")
      );

      const arr: any[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));

      console.log(arr);
    })();
  }, []);

  return <div>Debug</div>;
}
