package com.challengerewards.service;

import com.challengerewards.domain.Account;
import com.challengerewards.domain.AppUser;
import com.challengerewards.domain.Enums.Role;
import com.challengerewards.domain.Organization;
import com.challengerewards.repo.AccountRepo;
import com.challengerewards.repo.OrgRepo;
import com.challengerewards.repo.UserRepo;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    public record Session(String token, Role role, String subjectId, String username, String displayName) {}

    private final Map<String, Session> sessions = new ConcurrentHashMap<>();

    private final AccountRepo accounts;
    private final UserRepo users;
    private final OrgRepo orgs;

    public AuthService(AccountRepo accounts, UserRepo users, OrgRepo orgs) {
        this.accounts = accounts;
        this.users = users;
        this.orgs = orgs;
    }

    public Session login(String username, String password) {
        Account account = accounts.findByUsername(normalize(username))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (password == null || !password.equals(account.password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        return startSession(account);
    }

    public Session register(String username, String password, Role role, String displayName) {
        if (role == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin accounts cannot self-register");
        }
        String uname = normalize(username);
        if (uname.isEmpty() || password == null || password.length() < 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username required and password must be 4+ chars");
        }
        if (accounts.existsByUsername(uname)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }
        String name = (displayName == null || displayName.isBlank()) ? username : displayName.trim();

        String subjectId;
        if (role == Role.USER) {
            AppUser u = new AppUser();
            u.id = "user-" + UUID.randomUUID().toString().substring(0, 8);
            u.name = name;
            u.avatar = initials(name);
            users.save(u);
            subjectId = u.id;
        } else {
            Organization o = new Organization();
            o.id = "org-" + UUID.randomUUID().toString().substring(0, 8);
            o.name = name;
            o.avatar = initials(name);
            orgs.save(o);
            subjectId = o.id;
        }

        Account account = new Account();
        account.id = "acc-" + UUID.randomUUID().toString().substring(0, 8);
        account.username = uname;
        account.password = password;
        account.role = role;
        account.subjectId = subjectId;
        account.displayName = name;
        accounts.save(account);

        return startSession(account);
    }

    public Session resolve(String token) {
        if (token == null) return null;
        return sessions.get(token);
    }

    public void logout(String token) {
        if (token != null) sessions.remove(token);
    }

    public Session require(String token, Role role) {
        Session s = resolve(token);
        if (s == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        if (s.role() != role) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Requires " + role + " role");
        }
        return s;
    }

    public Session requireAny(String token) {
        Session s = resolve(token);
        if (s == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return s;
    }

    private Session startSession(Account account) {
        String token = UUID.randomUUID().toString();
        Session session = new Session(token, account.role, account.subjectId, account.username, account.displayName);
        sessions.put(token, session);
        return session;
    }

    private static String normalize(String username) {
        return username == null ? "" : username.trim().toLowerCase();
    }

    private static String initials(String name) {
        String[] parts = name.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            if (!p.isEmpty()) sb.append(Character.toUpperCase(p.charAt(0)));
            if (sb.length() == 2) break;
        }
        return sb.length() == 0 ? "?" : sb.toString();
    }
}
