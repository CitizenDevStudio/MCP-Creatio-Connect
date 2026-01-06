import type { CreatioAccount, CreatioConfig, QueryParams } from "@shared/schema";

interface CreatioSession {
  cookies: string;
  csrfToken: string;
  expiresAt: number;
}

interface ODataResponse<T> {
  value: T[];
  "@odata.count"?: number;
}

export class CreatioClient {
  private config: CreatioConfig;
  private session: CreatioSession | null = null;
  private sessionTimeout = 30 * 60 * 1000;

  constructor(config: CreatioConfig) {
    this.config = config;
  }

  private get baseUrl(): string {
    return this.config.baseUrl.replace(/\/$/, "");
  }

  private isSessionValid(): boolean {
    if (!this.session) return false;
    return Date.now() < this.session.expiresAt;
  }

  async authenticate(): Promise<void> {
    const loginUrl = `${this.baseUrl}/ServiceModel/AuthService.svc/Login`;

    const response = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        UserName: this.config.username,
        UserPassword: this.config.password,
      }),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.Code !== 0) {
      throw new Error(result.Message || "Authentication failed");
    }

    let setCookieHeaders: string[] = [];
    
    if (typeof response.headers.getSetCookie === "function") {
      setCookieHeaders = response.headers.getSetCookie();
    } else {
      const rawCookie = response.headers.get("set-cookie");
      if (rawCookie) {
        setCookieHeaders = rawCookie.split(/,(?=\s*[A-Za-z_][A-Za-z0-9_-]*=)/);
      }
    }

    const cookieParts: string[] = [];
    let csrfToken = "";

    for (const cookieHeader of setCookieHeaders) {
      const cookieMatch = cookieHeader.match(/^([^=]+)=([^;]*)/);
      if (cookieMatch) {
        const name = cookieMatch[1].trim();
        const value = cookieMatch[2].trim();

        if (name === "BPMCSRF") {
          csrfToken = value;
        }

        if (["BPMCSRF", ".ASPXAUTH", "BPMLOADER", "UserName"].includes(name)) {
          cookieParts.push(`${name}=${value}`);
        }
      }
    }

    const cookies = cookieParts.join("; ");

    if (!csrfToken && cookies) {
      const bpmcsrfMatch = cookies.match(/BPMCSRF=([^;]+)/);
      if (bpmcsrfMatch) {
        csrfToken = bpmcsrfMatch[1];
      }
    }

    if (!cookies || !csrfToken) {
      console.warn("Warning: Could not extract all authentication cookies from Creatio response");
      console.warn("Cookies found:", cookies);
      console.warn("CSRF token found:", csrfToken ? "yes" : "no");
    }

    this.session = {
      cookies,
      csrfToken,
      expiresAt: Date.now() + this.sessionTimeout,
    };
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.isSessionValid()) {
      await this.authenticate();
    }
  }

  private getHeaders(): Record<string, string> {
    if (!this.session) {
      throw new Error("Not authenticated");
    }

    return {
      Accept: "application/json",
      "Content-Type": "application/json; charset=utf-8; IEEE754Compatible=true",
      ForceUseSession: "true",
      BPMCSRF: this.session.csrfToken,
      Cookie: this.session.cookies,
    };
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.authenticate();
      return {
        success: true,
        message: "Successfully connected to Creatio instance",
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  async queryAccounts(params: QueryParams = {}): Promise<CreatioAccount[]> {
    await this.ensureAuthenticated();

    const queryParts: string[] = [];

    if (params.filter) {
      queryParts.push(`$filter=${encodeURIComponent(params.filter)}`);
    }

    if (params.select) {
      queryParts.push(`$select=${encodeURIComponent(params.select)}`);
    }

    if (params.top) {
      queryParts.push(`$top=${params.top}`);
    }

    if (params.skip) {
      queryParts.push(`$skip=${params.skip}`);
    }

    if (params.orderby) {
      queryParts.push(`$orderby=${encodeURIComponent(params.orderby)}`);
    }

    if (params.expand) {
      queryParts.push(`$expand=${encodeURIComponent(params.expand)}`);
    }

    const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    const url = `${this.baseUrl}/0/odata/Account${queryString}`;

    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });

    const contentType = response.headers.get("content-type") || "";
    const responseText = await response.text();

    if (!response.ok) {
      if (contentType.includes("text/html")) {
        const titleMatch = responseText.match(/<title>([^<]+)<\/title>/i);
        const errorTitle = titleMatch ? titleMatch[1] : "Access Denied";
        throw new Error(`Creatio returned an error page: ${errorTitle}. Your API user may need the 'CanUseODataService' permission.`);
      }
      throw new Error(`Query failed: ${response.status} ${response.statusText} - ${responseText}`);
    }

    if (contentType.includes("text/html")) {
      const titleMatch = responseText.match(/<title>([^<]+)<\/title>/i);
      const errorTitle = titleMatch ? titleMatch[1] : "Unknown Error";
      throw new Error(`Creatio returned HTML instead of JSON: ${errorTitle}. Check that your user has OData API access permissions.`);
    }

    try {
      const data: ODataResponse<CreatioAccount> = JSON.parse(responseText);
      return data.value || [];
    } catch {
      throw new Error(`Invalid response from Creatio. Expected JSON but received: ${responseText.substring(0, 200)}...`);
    }
  }

  async getAccountById(id: string): Promise<CreatioAccount | null> {
    await this.ensureAuthenticated();

    const url = `${this.baseUrl}/0/odata/Account(${id})`;

    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Get account failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async createAccount(account: Partial<CreatioAccount>): Promise<CreatioAccount> {
    await this.ensureAuthenticated();

    const url = `${this.baseUrl}/0/odata/Account`;

    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(account),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Create account failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async updateAccount(id: string, updates: Partial<CreatioAccount>): Promise<void> {
    await this.ensureAuthenticated();

    const url = `${this.baseUrl}/0/odata/Account(${id})`;

    const response = await fetch(url, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Update account failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
  }

  async deleteAccount(id: string): Promise<void> {
    await this.ensureAuthenticated();

    const url = `${this.baseUrl}/0/odata/Account(${id})`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!response.ok && response.status !== 204) {
      const errorText = await response.text();
      throw new Error(`Delete account failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
  }
}

let currentClient: CreatioClient | null = null;

export function getCreatioClient(): CreatioClient | null {
  return currentClient;
}

export function setCreatioClient(client: CreatioClient): void {
  currentClient = client;
}

export function createCreatioClient(config: CreatioConfig): CreatioClient {
  const client = new CreatioClient(config);
  setCreatioClient(client);
  return client;
}
