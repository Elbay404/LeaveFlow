package com.example.leave_management.service;

import lombok.RequiredArgsConstructor;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.filter.EqualsFilter;
import org.springframework.ldap.support.LdapNameBuilder;
import org.springframework.stereotype.Service;

import javax.naming.directory.BasicAttribute;
import javax.naming.directory.BasicAttributes;

import javax.naming.directory.Attributes;


@Service
@RequiredArgsConstructor
public class LdapService {

    private final LdapTemplate ldapTemplate;

    public boolean authenticate(String username, String password) {

        return ldapTemplate.authenticate(
                "ou=people",
                new EqualsFilter("uid", username).encode(),
                password
        );
    }


    public void createUser(
            String uid,
            String firstName,
            String lastName,
            String email,
            String password
    ) {

        Attributes attributes = new BasicAttributes();

        BasicAttribute objectClass = new BasicAttribute("objectClass");
        objectClass.add("top");
        objectClass.add("person");
        objectClass.add("organizationalPerson");
        objectClass.add("inetOrgPerson");

        attributes.put(objectClass);
        attributes.put("uid", uid);
        attributes.put("cn", firstName + " " + lastName);
        attributes.put("sn", lastName);
        attributes.put("givenName", firstName);
        attributes.put("mail", email);
        attributes.put("userPassword", password);

        ldapTemplate.bind(
                LdapNameBuilder.newInstance()
                        .add("ou", "people")
                        .add("uid", uid)
                        .build(),
                null,
                attributes
        );
    }


    public void changePassword(String uid, String newPassword) {

        ldapTemplate.modifyAttributes(
                "uid=" + uid + ",ou=people",
                new javax.naming.directory.ModificationItem[]{
                        new javax.naming.directory.ModificationItem(
                                javax.naming.directory.DirContext.REPLACE_ATTRIBUTE,
                                new BasicAttribute("userPassword", newPassword)
                        )
                }
        );
    }


}