'use client'
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea";
import { setCookie, getCookie, deleteCookie } from "cookies-next";
import axios, { Axios, AxiosResponse } from "axios";
import { useState } from "react";


export default function Home() {
  const [ response, setResponse ] = useState<AxiosResponse<any, any> | undefined>(undefined)

  function onRequest(res: AxiosResponse<any, any>) {
    console.log("--> "+JSON.stringify(res))
    console.log("---> "+res.data)
    if (res.data.accessToken && res.data.refreshToken) {
      setCookie("ACCESS_TOKEN_USER", res.data.accessToken)
      setCookie("REFRESH_TOKEN_USER", res.data.refreshToken)
    } 
    setResponse(res)
  }

  return (
    <div className="w-screen h-screen bg-blue-100">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel>
          <InputURLAndData onRequest={onRequest}/>
        </ResizablePanel>
        <ResizableHandle withHandle className="bg-slate-400" />
        <ResizablePanel>
          <ShowResponse response={response}/>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}


function InputURLAndData({ onRequest }: { onRequest: (res: AxiosResponse<any, any>) => void }) {
  const formSchema = z.object({
    method: z.string().refine((val: string) => ["GET", "POST", "DELETE", "PATCH"].includes(val), {
      message: "Invalid Method"
    }),
    requestUrl: z.string().refine((val: string) => val.startsWith('http://localhost:4000'), {
      message: "The URL entered must starts with \"http://localhost:4000\""
    }),
    jsonReqBody: z.string().refine((val: string): boolean => {
      try {
        JSON.parse(val);
        return true
      }
      catch (e) {
        return false
      }
    })
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      method: "",
      requestUrl: "",
      jsonReqBody: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    const dataSent = JSON.parse(values.jsonReqBody)
    const currentToken = getCookie("ACCESS_TOKEN_USER")
    const requestConfiguration = {
      method: values.method,
      url: values.requestUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      data: dataSent
    }
    const res = await axios.request(requestConfiguration)

    if (values.requestUrl === "http://localhost:4000/auth/logout") {
      deleteCookie("ACCESS_TOKEN_USER")
      deleteCookie("REFRESH_TOKEN_USER")
    }

    onRequest(res)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col space-y-8 p-3 space-x-1 h-full">

      <FormField
          control={form.control}
          name="method"
          render={({ field }) => (
            <FormItem >
              <FormLabel>Method</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Enter your Request Method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-green-100">
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requestUrl"
          render={({ field }) => (
            <FormItem className="flex-shrink-0">
              <FormLabel>Request URL</FormLabel>
              <FormControl>
                <Input className="code-input" placeholder="http://localhost:4000/auth/login" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jsonReqBody"
          render={({ field }) => (
            <FormItem className="flex-grow">
              <FormLabel>Request Body (JSON)</FormLabel>
              <FormControl className="flex-grow min-h-[0]">
                <code className="min-h-[0]">
                  <Textarea className="flex min-h-[0] h-[90%]" placeholder="{}" {...field} />
                </code>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}


function ShowResponse({ response }: { response: AxiosResponse<any, any> | undefined}) {
  return (
    <div className="h-full flex flex-col space-y-8 p-3">
      <div className="bg-white">
        <div>
          Status: {response?.status}
        </div>
      </div>

      <div className="bg-white overflow-x-auto h-[90%] max-w-full">
        <code className="whitespace-pre-wrap">
          {JSON.stringify(response?.data, null, 2)}
        </code>
      </div>
    </div>
  );
}