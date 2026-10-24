import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
 plugins:[react()],
 build:{
   outDir:"dist",
   sourcemap:false,
   chunkSizeWarningLimit:550,
   rollupOptions:{output:{manualChunks(id){
     if(!id.includes("node_modules"))return;
     if(/node_modules\/(recharts|d3-|victory-vendor)/.test(id))return "charts";
     if(id.includes("node_modules/@supabase/"))return "supabase";
     if(/node_modules\/(react|react-dom|scheduler)/.test(id))return "react";
   }}}
 }
});
